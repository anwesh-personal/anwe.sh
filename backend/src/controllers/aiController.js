/**
 * AI Controller
 * Handles AI execution requests
 */

import aiService from '../services/aiService.js';
import pool from '../config/database.js';

export const getProviders = async (req, res) => {
  try {
    const providers = await aiService.getAvailableProviders(req.tenantId);
    res.json({ providers });
  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({ error: 'Failed to get providers' });
  }
};

export const getModels = async (req, res) => {
  try {
    const { providerId } = req.params;
    
    const query = providerId
      ? 'SELECT * FROM ai_models WHERE provider_id = $1 AND is_active = true'
      : 'SELECT * FROM ai_models WHERE (tenant_id = $1 OR tenant_id IS NULL) AND is_active = true';
    
    const { rows } = await pool.query(query, providerId ? [providerId] : [req.tenantId]);
    
    res.json({ models: rows });
  } catch (error) {
    console.error('Get models error:', error);
    res.status(500).json({ error: 'Failed to get models' });
  }
};

export const execute = async (req, res) => {
  try {
    const { modelId, prompt, systemPrompt, temperature, maxTokens, stream } = req.body;

    if (!modelId || !prompt) {
      return res.status(400).json({ error: 'Model ID and prompt are required' });
    }

    const result = await aiService.execute(
      req.user.id,
      req.tenantId,
      modelId,
      prompt,
      {
        systemPrompt,
        temperature: temperature || 0.7,
        maxTokens: maxTokens || 1000,
        stream: stream || false
      }
    );

    res.json(result);
  } catch (error) {
    console.error('AI execution error:', error);
    res.status(500).json({ error: error.message || 'AI execution failed' });
  }
};

export const getExecutions = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const { rows } = await pool.query(
      `SELECT 
        e.*,
        m.name as model_name,
        p.name as provider_name
      FROM ai_executions e
      LEFT JOIN ai_models m ON e.model_id = m.id
      LEFT JOIN ai_providers p ON e.provider_id = p.id
      WHERE e.user_id = $1
      ORDER BY e.created_at DESC
      LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    res.json({ executions: rows });
  } catch (error) {
    console.error('Get executions error:', error);
    res.status(500).json({ error: 'Failed to get executions' });
  }
};

export const getExecution = async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `SELECT 
        e.*,
        m.name as model_name,
        p.name as provider_name
      FROM ai_executions e
      LEFT JOIN ai_models m ON e.model_id = m.id
      LEFT JOIN ai_providers p ON e.provider_id = p.id
      WHERE e.id = $1 AND e.user_id = $2`,
      [id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Execution not found' });
    }

    res.json({ execution: rows[0] });
  } catch (error) {
    console.error('Get execution error:', error);
    res.status(500).json({ error: 'Failed to get execution' });
  }
};
