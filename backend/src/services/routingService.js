/**
 * Routing Service
 * Manages worker routing strategies and metrics
 */

import pool from '../config/database.js';

class RoutingService {
  /**
   * Get available routing strategies
   */
  async getStrategies(tenantId = null) {
    const query = tenantId
      ? 'SELECT * FROM routing_strategies WHERE (tenant_id = $1 OR tenant_id IS NULL) AND enabled = true ORDER BY recommended DESC, name'
      : 'SELECT * FROM routing_strategies WHERE tenant_id IS NULL AND enabled = true ORDER BY recommended DESC, name';
    
    const { rows } = await pool.query(query, tenantId ? [tenantId] : []);
    return rows;
  }

  /**
   * Get routing strategy
   */
  async getStrategy(strategyId) {
    const { rows } = await pool.query(
      'SELECT * FROM routing_strategies WHERE id = $1',
      [strategyId]
    );

    return rows[0] || null;
  }

  /**
   * Get worker registry
   */
  async getWorkers(tenantId = null) {
    const query = tenantId
      ? 'SELECT * FROM worker_registry WHERE tenant_id = $1 ORDER BY health_score DESC, last_heartbeat DESC'
      : 'SELECT * FROM worker_registry WHERE tenant_id IS NULL ORDER BY health_score DESC, last_heartbeat DESC';
    
    const { rows } = await pool.query(query, tenantId ? [tenantId] : []);
    return rows;
  }

  /**
   * Register worker
   */
  async registerWorker(tenantId, workerData) {
    const {
      workerId,
      workerType,
      capacity = 1,
      region = null,
      tags = [],
      metadata = {}
    } = workerData;

    const { rows } = await pool.query(
      `INSERT INTO worker_registry (
        tenant_id, worker_id, worker_type, capacity, region, tags, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (worker_id) DO UPDATE
      SET 
        worker_type = EXCLUDED.worker_type,
        capacity = EXCLUDED.capacity,
        region = EXCLUDED.region,
        tags = EXCLUDED.tags,
        metadata = EXCLUDED.metadata,
        last_heartbeat = now(),
        updated_at = now()
      RETURNING *`,
      [tenantId, workerId, workerType, capacity, region, JSON.stringify(tags), JSON.stringify(metadata)]
    );

    return rows[0];
  }

  /**
   * Update worker health
   */
  async updateWorkerHealth(workerId, healthData) {
    const {
      healthScore,
      currentLoad,
      status
    } = healthData;

    const setClause = [];
    const values = [];
    let paramCount = 1;

    if (healthScore !== undefined) {
      setClause.push(`health_score = $${paramCount++}`);
      values.push(healthScore);
    }
    if (currentLoad !== undefined) {
      setClause.push(`current_load = $${paramCount++}`);
      values.push(currentLoad);
    }
    if (status !== undefined) {
      setClause.push(`status = $${paramCount++}`);
      values.push(status);
    }

    setClause.push(`last_heartbeat = now()`);
    setClause.push(`updated_at = now()`);
    values.push(workerId);

    await pool.query(
      `UPDATE worker_registry 
       SET ${setClause.join(', ')}
       WHERE worker_id = $${paramCount}`,
      values
    );
  }

  /**
   * Route job to worker using strategy
   */
  async routeJob(tenantId, strategyId, jobData) {
    const strategy = await this.getStrategy(strategyId);
    if (!strategy) {
      throw new Error('Routing strategy not found');
    }

    const workers = await this.getWorkers(tenantId);
    const healthyWorkers = workers.filter(w => 
      w.status === 'active' && w.health_score > 60
    );

    if (healthyWorkers.length === 0) {
      throw new Error('No healthy workers available');
    }

    let selectedWorker;

    switch (strategyId) {
      case 'round_robin':
        selectedWorker = this.roundRobin(healthyWorkers);
        break;
      case 'least_loaded':
        selectedWorker = this.leastLoaded(healthyWorkers);
        break;
      case 'health_based':
        selectedWorker = this.healthBased(healthyWorkers);
        break;
      case 'capacity_aware':
        selectedWorker = this.capacityAware(healthyWorkers);
        break;
      default:
        selectedWorker = healthyWorkers[0];
    }

    // Update routing metrics
    await this.updateRoutingMetrics(tenantId, selectedWorker.worker_id, strategyId);

    return selectedWorker;
  }

  /**
   * Round robin routing
   */
  roundRobin(workers) {
    // Simple round robin - in production, use persistent counter
    return workers[Math.floor(Math.random() * workers.length)];
  }

  /**
   * Least loaded routing
   */
  leastLoaded(workers) {
    return workers.reduce((min, worker) => 
      worker.current_load < min.current_load ? worker : min
    );
  }

  /**
   * Health-based routing
   */
  healthBased(workers) {
    return workers.reduce((best, worker) => 
      worker.health_score > best.health_score ? worker : best
    );
  }

  /**
   * Capacity-aware routing
   */
  capacityAware(workers) {
    return workers.reduce((best, worker) => {
      const bestUtilization = best.current_load / best.capacity;
      const workerUtilization = worker.current_load / worker.capacity;
      return workerUtilization < bestUtilization ? worker : best;
    });
  }

  /**
   * Update routing metrics
   */
  async updateRoutingMetrics(tenantId, workerId, strategyId) {
    await pool.query(
      `INSERT INTO routing_metrics (tenant_id, worker_id, total_routed, by_worker, by_strategy)
       VALUES ($1, $2, 1, $3, $4)
       ON CONFLICT (worker_id) DO UPDATE
       SET 
         total_routed = routing_metrics.total_routed + 1,
         by_worker = jsonb_set(
           COALESCE(routing_metrics.by_worker, '{}'::jsonb),
           ARRAY[$2::text],
           COALESCE((routing_metrics.by_worker->>$2::text)::int, 0) + 1
         ),
         by_strategy = jsonb_set(
           COALESCE(routing_metrics.by_strategy, '{}'::jsonb),
           ARRAY[$4::text],
           COALESCE((routing_metrics.by_strategy->>$4::text)::int, 0) + 1
         ),
         updated_at = now()`,
      [tenantId, workerId, JSON.stringify({ [workerId]: 1 }), JSON.stringify({ [strategyId]: 1 })]
    );
  }

  /**
   * Log worker event
   */
  async logEvent(tenantId, workerId, eventType, eventData, severity = 'info') {
    await pool.query(
      `INSERT INTO worker_event_logs (
        tenant_id, worker_id, event_type, event_data, severity
      ) VALUES ($1, $2, $3, $4, $5)`,
      [tenantId, workerId, eventType, JSON.stringify(eventData), severity]
    );
  }
}

export default new RoutingService();
