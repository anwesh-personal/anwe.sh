/**
 * Authentication Middleware
 * JWT token validation and user context setup
 */

import jwt from 'jsonwebtoken';
import { setTenantContext } from '../config/database.js';
import pool from '../config/database.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const { rows } = await pool.query(
      'SELECT u.*, t.id as tenant_id FROM users u LEFT JOIN tenants t ON u.tenant_id = t.id WHERE u.id = $1 AND u.is_active = true',
      [decoded.userId]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    const user = rows[0];

    // Set tenant context for RLS
    await setTenantContext(user.tenant_id, user.id);

    // Attach user to request
    req.user = user;
    req.tenantId = user.tenant_id;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const { rows } = await pool.query(
        'SELECT u.*, t.id as tenant_id FROM users u LEFT JOIN tenants t ON u.tenant_id = t.id WHERE u.id = $1 AND u.is_active = true',
        [decoded.userId]
      );

      if (rows.length > 0) {
        const user = rows[0];
        await setTenantContext(user.tenant_id, user.id);
        req.user = user;
        req.tenantId = user.tenant_id;
      }
    }

    next();
  } catch (error) {
    // Continue without auth if token is invalid
    next();
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

export const requireSuperAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user is superadmin
    const { rows } = await pool.query(
      'SELECT * FROM superadmin_users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    );

    if (rows.length === 0) {
      return res.status(403).json({ error: 'Super admin access required' });
    }

    req.superAdmin = rows[0];
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
};
