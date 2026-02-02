/**
 * Migration Runner
 * Runs database migrations in order
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDir = path.join(__dirname, '../../../database/migrations');

async function runMigrations() {
  try {
    console.log('🔄 Starting database migrations...');

    // Get all migration files
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Run in order

    console.log(`📁 Found ${files.length} migration files`);

    // Check if migrations table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        run_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Get already run migrations
    const { rows: runMigrations } = await pool.query(
      'SELECT version FROM schema_migrations'
    );
    const runVersions = new Set(runMigrations.map(r => r.version));

    // Run each migration
    for (const file of files) {
      if (runVersions.has(file)) {
        console.log(`⏭️  Skipping ${file} (already run)`);
        continue;
      }

      console.log(`▶️  Running ${file}...`);

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      // Run migration in a transaction
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (version) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`✅ Completed ${file}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }

    console.log('✨ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
