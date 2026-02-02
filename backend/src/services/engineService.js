/**
 * Engine Service
 * Manages AI engine deployment, assignment, and execution
 */

import pool from '../config/database.js';
import crypto from 'crypto';

class EngineService {
  /**
   * Get engines available to user
   */
  async getAvailableEngines(userId, tenantId) {
    // Get user's level
    const { rows: userRows } = await pool.query(
      `SELECT u.level_id, u.tier, l.id as level_id
       FROM users u
       LEFT JOIN user_token_wallets w ON u.id = w.user_id
       LEFT JOIN levels l ON w.level_id = l.id
       WHERE u.id = $1`,
      [userId]
    );

    const user = userRows[0];
    const levelId = user?.level_id;
    const tier = user?.tier;

    // Get engines assigned to user, level, or tier
    const { rows } = await pool.query(
      `SELECT DISTINCT e.*
       FROM ai_engines e
       INNER JOIN engine_assignments a ON e.id = a.engine_id
       WHERE e.tenant_id = $1
         AND e.active = true
         AND a.active = true
         AND (
           (a.assignment_type = 'user' AND a.user_id = $2) OR
           (a.assignment_type = 'level' AND a.level_id = $3) OR
           (a.assignment_type = 'tier' AND a.tier = $4)
         )
       ORDER BY a.priority DESC, e.created_at DESC`,
      [tenantId, userId, levelId, tier]
    );

    return rows;
  }

  /**
   * Deploy engine
   */
  async deployEngine(tenantId, userId, engineData) {
    const {
      name,
      description,
      flowConfig,
      nodes,
      edges,
      models,
      executionMode = 'sequential',
      tier,
      isDefault = false
    } = engineData;

    const { rows } = await pool.query(
      `INSERT INTO ai_engines (
        tenant_id, name, description, flow_config, nodes, edges,
        models, execution_mode, tier, is_default, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        tenantId,
        name,
        description,
        JSON.stringify(flowConfig),
        JSON.stringify(nodes),
        JSON.stringify(edges),
        JSON.stringify(models),
        executionMode,
        tier,
        isDefault,
        userId
      ]
    );

    return rows[0];
  }

  /**
   * Assign engine to user/level/tier
   */
  async assignEngine(tenantId, assignmentData) {
    const {
      engineId,
      assignmentType,
      userId = null,
      levelId = null,
      tier = null,
      priority = 0
    } = assignmentData;

    const { rows } = await pool.query(
      `INSERT INTO engine_assignments (
        tenant_id, engine_id, assignment_type, user_id, level_id, tier, priority
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT DO NOTHING
      RETURNING *`,
      [tenantId, engineId, assignmentType, userId, levelId, tier, priority]
    );

    return rows[0];
  }

  /**
   * Create user engine copy
   */
  async createUserEngine(userId, tenantId, engineId) {
    // Get master engine
    const { rows: engineRows } = await pool.query(
      'SELECT * FROM ai_engines WHERE id = $1',
      [engineId]
    );

    if (engineRows.length === 0) {
      throw new Error('Engine not found');
    }

    const engine = engineRows[0];

    // Create user copy
    const { rows } = await pool.query(
      `INSERT INTO user_engines (
        tenant_id, user_id, engine_id, name, description,
        config, nodes, edges, models, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (tenant_id, user_id, engine_id) DO UPDATE
      SET updated_at = now()
      RETURNING *`,
      [
        tenantId,
        userId,
        engineId,
        engine.name,
        engine.description,
        engine.flow_config,
        engine.nodes,
        engine.edges,
        engine.models,
        'active'
      ]
    );

    return rows[0];
  }

  /**
   * Generate API key for user engine
   */
  async generateAPIKey(userEngineId, userId) {
    const apiKey = `sk_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    await pool.query(
      `UPDATE user_engines
       SET api_key = $1, api_key_created_at = now()
       WHERE id = $2 AND user_id = $3`,
      [keyHash, userEngineId, userId]
    );

    return apiKey;
  }

  /**
   * Execute engine
   */
  async executeEngine(userId, tenantId, engineId, inputData) {
    // Create execution record
    const { rows } = await pool.query(
      `INSERT INTO engine_executions (
        tenant_id, engine_id, user_id, status, input_data
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [tenantId, engineId, userId, 'running', JSON.stringify(inputData)]
    );

    const executionId = rows[0].id;

    // Update engine last used
    await pool.query(
      'UPDATE ai_engines SET last_used = now() WHERE id = $1',
      [engineId]
    );

    return { executionId, execution: rows[0] };
  }

  /**
   * Update execution
   */
  async updateExecution(executionId, updates) {
    const {
      status,
      errorMessage,
      executionTimeMs,
      tokensUsed,
      costEstimate
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
    if (errorMessage !== undefined) {
      setClause.push(`error_message = $${paramCount++}`);
      values.push(errorMessage);
    }
    if (executionTimeMs !== undefined) {
      setClause.push(`execution_time_ms = $${paramCount++}`);
      values.push(executionTimeMs);
    }
    if (tokensUsed !== undefined) {
      setClause.push(`tokens_used = $${paramCount++}`);
      values.push(tokensUsed);
    }
    if (costEstimate !== undefined) {
      setClause.push(`cost_estimate = $${paramCount++}`);
      values.push(costEstimate);
    }

    values.push(executionId);

    await pool.query(
      `UPDATE engine_executions 
       SET ${setClause.join(', ')}
       WHERE id = $${paramCount}`,
      values
    );
  }
}

export default new EngineService();
