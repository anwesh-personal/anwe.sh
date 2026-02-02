/**
 * Workflow Service
 * Manages workflow definitions, execution, and templates
 */

import pool from '../config/database.js';

class WorkflowService {
  /**
   * Get workflows for user
   */
  async getWorkflows(userId, tenantId, options = {}) {
    const { includePublic = false, limit = 50, offset = 0 } = options;

    let query = `
      SELECT * FROM ai_workflows
      WHERE tenant_id = $1
    `;
    const params = [tenantId];

    if (includePublic) {
      query += ' AND (created_by = $2 OR is_public = true)';
      params.push(userId);
    } else {
      query += ' AND created_by = $2';
      params.push(userId);
    }

    query += ' ORDER BY created_at DESC LIMIT $3 OFFSET $4';
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);
    return rows;
  }

  /**
   * Create workflow
   */
  async createWorkflow(userId, tenantId, workflowData) {
    const { name, description, nodes, connections, isPublic = false, metadata = {} } = workflowData;

    const { rows } = await pool.query(
      `INSERT INTO ai_workflows (
        tenant_id, name, description, nodes, connections,
        is_public, created_by, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [tenantId, name, description, JSON.stringify(nodes), JSON.stringify(connections), isPublic, userId, JSON.stringify(metadata)]
    );

    return rows[0];
  }

  /**
   * Update workflow
   */
  async updateWorkflow(workflowId, userId, updates) {
    const { name, description, nodes, connections, isActive, metadata } = updates;
    const setClause = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      setClause.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (description !== undefined) {
      setClause.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (nodes !== undefined) {
      setClause.push(`nodes = $${paramCount++}`);
      values.push(JSON.stringify(nodes));
    }
    if (connections !== undefined) {
      setClause.push(`connections = $${paramCount++}`);
      values.push(JSON.stringify(connections));
    }
    if (isActive !== undefined) {
      setClause.push(`is_active = $${paramCount++}`);
      values.push(isActive);
    }
    if (metadata !== undefined) {
      setClause.push(`metadata = $${paramCount++}`);
      values.push(JSON.stringify(metadata));
    }

    if (setClause.length === 0) {
      throw new Error('No updates provided');
    }

    values.push(workflowId, userId);
    setClause.push(`updated_at = now()`);

    const { rows } = await pool.query(
      `UPDATE ai_workflows 
       SET ${setClause.join(', ')}
       WHERE id = $${paramCount++} AND created_by = $${paramCount++}
       RETURNING *`,
      values
    );

    if (rows.length === 0) {
      throw new Error('Workflow not found or access denied');
    }

    return rows[0];
  }

  /**
   * Create workflow execution
   */
  async createExecution(userId, tenantId, workflowId, inputData = {}) {
    const { rows } = await pool.query(
      `INSERT INTO workflow_executions (
        tenant_id, workflow_id, user_id, status, context
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [tenantId, workflowId, userId, 'pending', JSON.stringify({ input: inputData })]
    );

    return rows[0];
  }

  /**
   * Update execution status
   */
  async updateExecution(executionId, updates) {
    const {
      status,
      progress,
      currentStep,
      steps,
      results,
      metrics,
      errorMessage
    } = updates;

    const setClause = [];
    const values = [];
    let paramCount = 1;

    if (status !== undefined) {
      setClause.push(`status = $${paramCount++}`);
      values.push(status);
      if (status === 'completed' || status === 'failed') {
        setClause.push(`completed_at = now()`);
      }
    }
    if (progress !== undefined) {
      setClause.push(`progress = $${paramCount++}`);
      values.push(progress);
    }
    if (currentStep !== undefined) {
      setClause.push(`current_step = $${paramCount++}`);
      values.push(currentStep);
    }
    if (steps !== undefined) {
      setClause.push(`steps = $${paramCount++}`);
      values.push(JSON.stringify(steps));
    }
    if (results !== undefined) {
      setClause.push(`results = $${paramCount++}`);
      values.push(JSON.stringify(results));
    }
    if (metrics !== undefined) {
      setClause.push(`metrics = $${paramCount++}`);
      values.push(JSON.stringify(metrics));
    }
    if (errorMessage !== undefined) {
      setClause.push(`error_message = $${paramCount++}`);
      values.push(errorMessage);
    }

    setClause.push(`updated_at = now()`);
    values.push(executionId);

    await pool.query(
      `UPDATE workflow_executions 
       SET ${setClause.join(', ')}
       WHERE id = $${paramCount}`,
      values
    );
  }

  /**
   * Get execution history
   */
  async getExecutions(userId, tenantId, limit = 50, offset = 0) {
    const { rows } = await pool.query(
      `SELECT 
        e.*,
        w.name as workflow_name
      FROM workflow_executions e
      LEFT JOIN ai_workflows w ON e.workflow_id = w.id
      WHERE e.user_id = $1 AND e.tenant_id = $2
      ORDER BY e.created_at DESC
      LIMIT $3 OFFSET $4`,
      [userId, tenantId, limit, offset]
    );

    return rows;
  }

  /**
   * Get workflow templates
   */
  async getTemplates(tenantId, category = null) {
    let query = `
      SELECT * FROM workflow_templates
      WHERE (tenant_id = $1 OR tenant_id IS NULL) AND is_public = true
    `;
    const params = [tenantId];

    if (category) {
      query += ' AND category = $2';
      params.push(category);
    }

    query += ' ORDER BY usage_count DESC, created_at DESC';

    const { rows } = await pool.query(query, params);
    return rows;
  }
}

export default new WorkflowService();
