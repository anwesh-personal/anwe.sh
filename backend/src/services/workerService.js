/**
 * Worker Service
 * Manages worker registry, health monitoring, and routing
 */

import pool from '../config/database.js';

class WorkerService {
  /**
   * Register or update worker
   */
  async registerWorker(tenantId, workerData) {
    const {
      workerId,
      workerType,
      capacity = 1,
      currentLoad = 0,
      region = null,
      tags = [],
      metadata = {}
    } = workerData;

    const { rows } = await pool.query(
      `INSERT INTO worker_registry (
        tenant_id, worker_id, worker_type, capacity, current_load,
        region, tags, metadata, status, health_score, last_heartbeat
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now())
      ON CONFLICT (worker_id) DO UPDATE SET
        worker_type = EXCLUDED.worker_type,
        capacity = EXCLUDED.capacity,
        current_load = EXCLUDED.current_load,
        region = EXCLUDED.region,
        tags = EXCLUDED.tags,
        metadata = EXCLUDED.metadata,
        last_heartbeat = now(),
        updated_at = now()
      RETURNING *`,
      [tenantId, workerId, workerType, capacity, currentLoad, region, JSON.stringify(tags), JSON.stringify(metadata), 'active', 100]
    );

    return rows[0];
  }

  /**
   * Update worker heartbeat
   */
  async updateHeartbeat(workerId) {
    await pool.query(
      `UPDATE worker_registry 
       SET last_heartbeat = now(), updated_at = now()
       WHERE worker_id = $1`,
      [workerId]
    );
  }

  /**
   * Update worker health score
   */
  async updateHealthScore(workerId, healthScore) {
    const status = healthScore < 30 ? 'error' : healthScore < 60 ? 'maintenance' : 'active';

    const { rows } = await pool.query(
      `UPDATE worker_registry 
       SET health_score = $1, status = $2, updated_at = now()
       WHERE worker_id = $3
       RETURNING *`,
      [healthScore, status, workerId]
    );

    return rows[0];
  }

  /**
   * Update worker load
   */
  async updateLoad(workerId, currentLoad) {
    const { rows } = await pool.query(
      `UPDATE worker_registry 
       SET current_load = $1, updated_at = now()
       WHERE worker_id = $2
       RETURNING *`,
      [currentLoad, workerId]
    );

    return rows[0];
  }

  /**
   * Get workers for tenant
   */
  async getWorkers(tenantId, options = {}) {
    const {
      status = null,
      workerType = null,
      region = null,
      minHealthScore = null
    } = options;

    let query = `
      SELECT * FROM worker_registry
      WHERE tenant_id = $1
    `;
    const params = [tenantId];
    let paramCount = 2;

    if (status) {
      query += ` AND status = $${paramCount++}`;
      params.push(status);
    }
    if (workerType) {
      query += ` AND worker_type = $${paramCount++}`;
      params.push(workerType);
    }
    if (region) {
      query += ` AND region = $${paramCount++}`;
      params.push(region);
    }
    if (minHealthScore !== null) {
      query += ` AND health_score >= $${paramCount++}`;
      params.push(minHealthScore);
    }

    query += ` ORDER BY last_heartbeat DESC, health_score DESC`;

    const { rows } = await pool.query(query, params);
    return rows;
  }

  /**
   * Get worker by ID
   */
  async getWorker(workerId) {
    const { rows } = await pool.query(
      'SELECT * FROM worker_registry WHERE worker_id = $1',
      [workerId]
    );
    return rows[0];
  }

  /**
   * Log worker event
   */
  async logEvent(tenantId, workerId, eventType, eventData = {}, severity = 'info') {
    const { rows } = await pool.query(
      `INSERT INTO worker_event_logs (
        tenant_id, worker_id, event_type, event_data, severity
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [tenantId, workerId, eventType, JSON.stringify(eventData), severity]
    );
    return rows[0];
  }

  /**
   * Get worker events
   */
  async getEvents(tenantId, options = {}) {
    const {
      workerId = null,
      eventType = null,
      severity = null,
      startDate = null,
      endDate = null,
      limit = 100
    } = options;

    let query = `
      SELECT * FROM worker_event_logs
      WHERE tenant_id = $1
    `;
    const params = [tenantId];
    let paramCount = 2;

    if (workerId) {
      query += ` AND worker_id = $${paramCount++}`;
      params.push(workerId);
    }
    if (eventType) {
      query += ` AND event_type = $${paramCount++}`;
      params.push(eventType);
    }
    if (severity) {
      query += ` AND severity = $${paramCount++}`;
      params.push(severity);
    }
    if (startDate) {
      query += ` AND created_at >= $${paramCount++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND created_at <= $${paramCount++}`;
      params.push(endDate);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount}`;
    params.push(limit);

    const { rows } = await pool.query(query, params);
    return rows;
  }

  /**
   * Get worker statistics
   */
  async getWorkerStats(tenantId) {
    const stats = await pool.query(
      `SELECT 
        COUNT(*) as total_workers,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_workers,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_workers,
        COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance_workers,
        COUNT(CASE WHEN status = 'error' THEN 1 END) as error_workers,
        AVG(health_score) as avg_health_score,
        SUM(capacity) as total_capacity,
        SUM(current_load) as total_load,
        COUNT(CASE WHEN last_heartbeat < now() - interval '5 minutes' THEN 1 END) as stale_workers
      FROM worker_registry
      WHERE tenant_id = $1`,
      [tenantId]
    );

    return stats.rows[0];
  }

  /**
   * Set worker status
   */
  async setStatus(workerId, status) {
    const { rows } = await pool.query(
      `UPDATE worker_registry 
       SET status = $1, updated_at = now()
       WHERE worker_id = $2
       RETURNING *`,
      [status, workerId]
    );
    return rows[0];
  }

  /**
   * Get available workers for routing
   */
  async getAvailableWorkers(tenantId, options = {}) {
    const {
      workerType = null,
      minHealthScore = 60,
      maxLoadPercent = 80
    } = options;

    let query = `
      SELECT * FROM worker_registry
      WHERE tenant_id = $1
        AND status = 'active'
        AND health_score >= $2
        AND (current_load::float / NULLIF(capacity, 0) * 100) <= $3
    `;
    const params = [tenantId, minHealthScore, maxLoadPercent];

    if (workerType) {
      query += ` AND worker_type = $4`;
      params.push(workerType);
    }

    query += ` ORDER BY (current_load::float / NULLIF(capacity, 0)) ASC, health_score DESC`;

    const { rows } = await pool.query(query, params);
    return rows;
  }
}

export default new WorkerService();
