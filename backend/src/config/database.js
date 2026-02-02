/**
 * Database Configuration
 * PostgreSQL connection pool setup
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Database connected');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

// Helper function to set tenant context
export const setTenantContext = async (tenantId, userId) => {
  await pool.query('SET app.tenant_id = $1', [tenantId || null]);
  await pool.query('SET app.user_id = $1', [userId || null]);
};

// Helper function to clear context
export const clearContext = async () => {
  await pool.query('SET app.tenant_id = NULL');
  await pool.query('SET app.user_id = NULL');
};

export default pool;
