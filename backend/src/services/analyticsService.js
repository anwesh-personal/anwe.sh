/**
 * Analytics Service
 * Manages analytics, metrics, and reporting
 */

import pool from '../config/database.js';

class AnalyticsService {
  /**
   * Get system metrics for tenant
   */
  async getSystemMetrics(tenantId, options = {}) {
    const {
      metricType = null,
      startDate = null,
      endDate = null,
      limit = 1000
    } = options;

    let query = `
      SELECT * FROM system_metrics
      WHERE tenant_id = $1
    `;
    const params = [tenantId];
    let paramCount = 2;

    if (metricType) {
      query += ` AND metric_type = $${paramCount++}`;
      params.push(metricType);
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
   * Get aggregated metrics
   */
  async getAggregatedMetrics(tenantId, options = {}) {
    const {
      metricType,
      startDate,
      endDate,
      groupBy = 'day'
    } = options;

    let dateFormat = "DATE_TRUNC('day', created_at)";
    if (groupBy === 'hour') {
      dateFormat = "DATE_TRUNC('hour', created_at)";
    } else if (groupBy === 'week') {
      dateFormat = "DATE_TRUNC('week', created_at)";
    } else if (groupBy === 'month') {
      dateFormat = "DATE_TRUNC('month', created_at)";
    }

    let query = `
      SELECT 
        ${dateFormat} as period,
        metric_type,
        COUNT(*) as count,
        jsonb_agg(metric_data) as data_points
      FROM system_metrics
      WHERE tenant_id = $1
    `;
    const params = [tenantId];
    let paramCount = 2;

    if (metricType) {
      query += ` AND metric_type = $${paramCount++}`;
      params.push(metricType);
    }
    if (startDate) {
      query += ` AND created_at >= $${paramCount++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND created_at <= $${paramCount++}`;
      params.push(endDate);
    }

    query += ` GROUP BY period, metric_type ORDER BY period DESC`;

    const { rows } = await pool.query(query, params);
    return rows;
  }

  /**
   * Get workflow execution analytics
   */
  async getWorkflowAnalytics(tenantId, options = {}) {
    const {
      startDate,
      endDate,
      workflowId = null
    } = options;

    let query = `
      SELECT 
        w.id as workflow_id,
        w.name as workflow_name,
        COUNT(e.id) as total_executions,
        COUNT(CASE WHEN e.status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN e.status = 'failed' THEN 1 END) as failed,
        COUNT(CASE WHEN e.status = 'running' THEN 1 END) as running,
        AVG(e.progress) as avg_progress,
        AVG(EXTRACT(EPOCH FROM (e.completed_at - e.created_at))) as avg_duration_seconds,
        SUM((e.metrics->>'tokens_used')::numeric) as total_tokens_used,
        SUM((e.metrics->>'cost')::numeric) as total_cost
      FROM ai_workflows w
      LEFT JOIN workflow_executions e ON w.id = e.workflow_id
      WHERE w.tenant_id = $1
    `;
    const params = [tenantId];
    let paramCount = 2;

    if (workflowId) {
      query += ` AND w.id = $${paramCount++}`;
      params.push(workflowId);
    }
    if (startDate) {
      query += ` AND e.created_at >= $${paramCount++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND e.created_at <= $${paramCount++}`;
      params.push(endDate);
    }

    query += ` GROUP BY w.id, w.name ORDER BY total_executions DESC`;

    const { rows } = await pool.query(query, params);
    return rows;
  }

  /**
   * Get engine execution analytics
   */
  async getEngineAnalytics(tenantId, options = {}) {
    const {
      startDate,
      endDate,
      engineId = null
    } = options;

    let query = `
      SELECT 
        e.engine_id,
        en.name as engine_name,
        COUNT(e.id) as total_executions,
        COUNT(CASE WHEN e.status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN e.status = 'failed' THEN 1 END) as failed,
        AVG(e.execution_time_ms) as avg_execution_time_ms,
        SUM(e.tokens_used) as total_tokens_used,
        SUM(e.cost_estimate) as total_cost
      FROM engine_executions e
      LEFT JOIN ai_engines en ON e.engine_id = en.id
      WHERE e.tenant_id = $1
    `;
    const params = [tenantId];
    let paramCount = 2;

    if (engineId) {
      query += ` AND e.engine_id = $${paramCount++}`;
      params.push(engineId);
    }
    if (startDate) {
      query += ` AND e.created_at >= $${paramCount++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND e.created_at <= $${paramCount++}`;
      params.push(endDate);
    }

    query += ` GROUP BY e.engine_id, en.name ORDER BY total_executions DESC`;

    const { rows } = await pool.query(query, params);
    return rows;
  }

  /**
   * Get token usage analytics
   */
  async getTokenAnalytics(tenantId, options = {}) {
    const {
      startDate,
      endDate,
      userId = null
    } = options;

    let query = `
      SELECT 
        u.id as user_id,
        u.email,
        SUM(COALESCE((entry->>'amount')::numeric, 0)) as total_tokens_used,
        COUNT(*) as transaction_count,
        MIN(created_at) as first_transaction,
        MAX(created_at) as last_transaction
      FROM token_ledger
      LEFT JOIN users u ON user_id = u.id
      WHERE tenant_id = $1 AND entry_type = 'debit'
    `;
    const params = [tenantId];
    let paramCount = 2;

    if (userId) {
      query += ` AND user_id = $${paramCount++}`;
      params.push(userId);
    }
    if (startDate) {
      query += ` AND created_at >= $${paramCount++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND created_at <= $${paramCount++}`;
      params.push(endDate);
    }

    query += ` GROUP BY u.id, u.email ORDER BY total_tokens_used DESC`;

    const { rows } = await pool.query(query, params);
    return rows;
  }

  /**
   * Get routing metrics
   */
  async getRoutingMetrics(tenantId, workerId = null) {
    let query = `
      SELECT * FROM routing_metrics
      WHERE tenant_id = $1
    `;
    const params = [tenantId];

    if (workerId) {
      query += ` AND worker_id = $2`;
      params.push(workerId);
    }

    query += ` ORDER BY updated_at DESC`;

    const { rows } = await pool.query(query, params);
    return rows;
  }

  /**
   * Record system metric
   */
  async recordMetric(tenantId, metricType, metricData) {
    const { rows } = await pool.query(
      `INSERT INTO system_metrics (tenant_id, metric_type, metric_data)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [tenantId, metricType, JSON.stringify(metricData)]
    );
    return rows[0];
  }

  /**
   * Get dashboard stats
   */
  async getDashboardStats(tenantId, userId = null) {
    const stats = {};

    // Workflow stats
    const workflowStats = await pool.query(
      `SELECT 
        COUNT(*) as total_workflows,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_workflows
      FROM ai_workflows
      WHERE tenant_id = $1 ${userId ? 'AND created_by = $2' : ''}`,
      userId ? [tenantId, userId] : [tenantId]
    );
    stats.workflows = workflowStats.rows[0];

    // Execution stats
    const executionStats = await pool.query(
      `SELECT 
        COUNT(*) as total_executions,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        COUNT(CASE WHEN status = 'running' THEN 1 END) as running
      FROM workflow_executions
      WHERE tenant_id = $1 ${userId ? 'AND user_id = $2' : ''}`,
      userId ? [tenantId, userId] : [tenantId]
    );
    stats.executions = executionStats.rows[0];

    // Engine stats
    const engineStats = await pool.query(
      `SELECT 
        COUNT(*) as total_engines,
        COUNT(CASE WHEN active = true THEN 1 END) as active_engines
      FROM ai_engines
      WHERE tenant_id = $1`,
      [tenantId]
    );
    stats.engines = engineStats.rows[0];

    // Token stats
    const tokenStats = await pool.query(
      `SELECT 
        SUM(COALESCE((entry->>'amount')::numeric, 0)) as total_used
      FROM token_ledger
      WHERE tenant_id = $1 AND entry_type = 'debit' ${userId ? 'AND user_id = $2' : ''}`,
      userId ? [tenantId, userId] : [tenantId]
    );
    stats.tokens = { totalUsed: parseFloat(tokenStats.rows[0]?.total_used || 0) };

    return stats;
  }
}

export default new AnalyticsService();
