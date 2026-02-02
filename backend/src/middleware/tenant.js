/**
 * Tenant Middleware
 * Ensures tenant context is set for all requests
 */

import { setTenantContext } from '../config/database.js';

export const tenantMiddleware = async (req, res, next) => {
  // If user is authenticated, tenant context is already set in auth middleware
  if (req.user && req.tenantId) {
    return next();
  }

  // For unauthenticated requests, try to get tenant from subdomain or header
  const tenantSlug = req.headers['x-tenant-slug'] || 
                     req.hostname?.split('.')[0] || 
                     'default';

  try {
    const pool = (await import('../config/database.js')).default;
    const { rows } = await pool.query(
      'SELECT id FROM tenants WHERE slug = $1 AND status = $2',
      [tenantSlug, 'active']
    );

    if (rows.length > 0) {
      await setTenantContext(rows[0].id, null);
      req.tenantId = rows[0].id;
    }
  } catch (error) {
    console.error('Tenant middleware error:', error);
  }

  next();
};
