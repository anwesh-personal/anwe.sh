/**
 * Super Admin Controller
 * Handles platform-wide administration
 */

import pool from '../config/database.js';

export const getStats = async (req, res) => {
  try {
    // Get total users
    const { rows: userRows } = await pool.query('SELECT COUNT(*) as count FROM users');
    const totalUsers = parseInt(userRows[0].count);

    // Get total tenants
    const { rows: tenantRows } = await pool.query('SELECT COUNT(*) as count FROM tenants');
    const totalTenants = parseInt(tenantRows[0].count);

    // Get total executions
    const { rows: execRows } = await pool.query('SELECT COUNT(*) as count FROM ai_executions');
    const totalExecutions = parseInt(execRows[0].count);

    // Get total tokens used
    const { rows: tokenRows } = await pool.query(
      'SELECT SUM(lifetime_tokens) as total FROM user_token_wallets'
    );
    const totalTokensUsed = parseInt(tokenRows[0].total || 0);

    // Get active users (logged in last 30 days)
    const { rows: activeRows } = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE last_login > now() - interval \'30 days\''
    );
    const activeUsers = parseInt(activeRows[0].count);

    res.json({
      totalUsers,
      totalTenants,
      totalExecutions,
      totalTokensUsed,
      activeUsers,
      revenue: 0, // TODO: Calculate from subscriptions
      growthRate: 0 // TODO: Calculate growth
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
};

export const getUsers = async (req, res) => {
  try {
    const { limit = 50, offset = 0, search = '' } = req.query;

    let query = `
      SELECT 
        u.id, u.email, u.full_name, u.role, u.tier, u.created_at,
        t.name as tenant_name
      FROM users u
      LEFT JOIN tenants t ON u.tenant_id = t.id
    `;

    const params = [];
    if (search) {
      query += ' WHERE u.email ILIKE $1 OR u.full_name ILIKE $1';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY u.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const { rows } = await pool.query(query, params);

    res.json({ users: rows });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
};

export const getTenants = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        t.*,
        COUNT(u.id) as user_count
      FROM tenants t
      LEFT JOIN users u ON u.tenant_id = t.id
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `);

    res.json({ tenants: rows });
  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({ error: 'Failed to get tenants' });
  }
};

export const getProviders = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        p.*,
        COUNT(m.id) as model_count
      FROM ai_providers p
      LEFT JOIN ai_models m ON m.provider_id = p.id
      GROUP BY p.id
      ORDER BY p.name
    `);

    res.json({ providers: rows });
  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({ error: 'Failed to get providers' });
  }
};

export const getSettings = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM system_configurations WHERE tenant_id IS NULL'
    );

    const settings = {};
    rows.forEach(row => {
      settings[row.key] = row.value;
    });

    res.json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const { settings } = req.body;

    for (const [key, value] of Object.entries(settings)) {
      await pool.query(
        `INSERT INTO system_configurations (tenant_id, key, value)
         VALUES (NULL, $1, $2)
         ON CONFLICT (tenant_id, key)
         DO UPDATE SET value = $2, updated_at = now()`,
        [key, JSON.stringify(value)]
      );
    }

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};
