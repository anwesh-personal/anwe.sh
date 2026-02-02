/**
 * Authentication Controller
 * Handles user registration, login, and session management
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { setTenantContext } from '../config/database.js';
import tokenService from '../services/tokenService.js';

export const register = async (req, res) => {
  try {
    const { email, password, fullName, tenantSlug } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get or create tenant
    let tenantId;
    if (tenantSlug) {
      const { rows: tenantRows } = await pool.query(
        'SELECT id FROM tenants WHERE slug = $1',
        [tenantSlug]
      );
      tenantId = tenantRows[0]?.id;
    }

    if (!tenantId) {
      // Create default tenant or use existing
      const { rows: defaultTenant } = await pool.query(
        "SELECT id FROM tenants WHERE slug = 'default' LIMIT 1"
      );
      tenantId = defaultTenant[0]?.id;
    }

    // Check if user exists
    const { rows: existingUsers } = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND tenant_id = $2',
      [email, tenantId]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const { rows: newUsers } = await pool.query(
      `INSERT INTO users (tenant_id, email, password_hash, full_name, role, tier)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, full_name, role, tier, tenant_id, created_at`,
      [tenantId, email, passwordHash, fullName || null, 'user', 'free']
    );

    const user = newUsers[0];

    // Create wallet
    await tokenService.ensureWallet(user.id);

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, tenantId: user.tenant_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        tier: user.tier
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, tenantSlug } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get tenant
    let tenantId;
    if (tenantSlug) {
      const { rows: tenantRows } = await pool.query(
        'SELECT id FROM tenants WHERE slug = $1',
        [tenantSlug]
      );
      tenantId = tenantRows[0]?.id;
    }

    // Get user
    const query = tenantId
      ? 'SELECT * FROM users WHERE email = $1 AND tenant_id = $2'
      : 'SELECT * FROM users WHERE email = $1';
    
    const params = tenantId ? [email, tenantId] : [email];
    const { rows: users } = await pool.query(query, params);

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = now() WHERE id = $1',
      [user.id]
    );

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, tenantId: user.tenant_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        tier: user.tier,
        tenantId: user.tenant_id
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT 
        u.id, u.email, u.full_name, u.username, u.role, u.tier,
        u.access_level, u.is_active, u.preferences, u.created_at,
        t.name as tenant_name, t.slug as tenant_slug
      FROM users u
      LEFT JOIN tenants t ON u.tenant_id = t.id
      WHERE u.id = $1`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: rows[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { fullName, username, preferences } = req.body;
    const updates = {};
    const values = [];
    let paramCount = 1;

    if (fullName !== undefined) {
      updates.full_name = fullName;
      values.push(fullName);
    }
    if (username !== undefined) {
      updates.username = username;
      values.push(username);
    }
    if (preferences !== undefined) {
      updates.preferences = preferences;
      values.push(JSON.stringify(preferences));
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${paramCount++}`)
      .join(', ');

    values.push(req.user.id);

    await pool.query(
      `UPDATE users SET ${setClause}, updated_at = now() WHERE id = $${paramCount}`,
      values
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};
