import type { Database } from './index.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================================
// Migration Functions
// ============================================================================

/**
 * Initialize database schema
 */
export async function initializeSchema(db: Database): Promise<void> {
  console.log('[db] Initializing database schema...');

  const schemaPath = join(__dirname, 'schema.sql');
  const schemaSql = readFileSync(schemaPath, 'utf-8');

  await db.none(schemaSql);

  console.log('[db] Database schema initialized successfully');
}

/**
 * Check if database is initialized
 */
export async function isDatabaseInitialized(db: Database): Promise<boolean> {
  try {
    const result = await db.oneOrNone(
      `
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'services'
      ) as exists
      `
    );
    return result?.exists ?? false;
  } catch (error) {
    console.error('[db] Error checking database initialization:', error);
    return false;
  }
}

/**
 * Drop all tables (DESTRUCTIVE - use with caution!)
 */
export async function dropAllTables(db: Database): Promise<void> {
  console.log('[db] Dropping all tables...');

  await db.none(`
    DROP TABLE IF EXISTS idempotency_cache CASCADE;
    DROP TABLE IF EXISTS dlq CASCADE;
    DROP TABLE IF EXISTS task_runs CASCADE;
    DROP TABLE IF EXISTS pipeline_runs CASCADE;
    DROP TABLE IF EXISTS pipelines CASCADE;
    DROP TABLE IF EXISTS task_code_history CASCADE;
    DROP TABLE IF EXISTS tasks CASCADE;
    DROP TABLE IF EXISTS services CASCADE;
    DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
    DROP FUNCTION IF EXISTS cleanup_expired_idempotency_cache CASCADE;
  `);

  console.log('[db] All tables dropped successfully');
}

/**
 * Reset database (drop and recreate)
 */
export async function resetDatabase(db: Database): Promise<void> {
  console.log('[db] Resetting database...');
  await dropAllTables(db);
  await initializeSchema(db);
  console.log('[db] Database reset complete');
}

/**
 * Get database status
 */
export async function getDatabaseStatus(db: Database): Promise<{
  initialized: boolean;
  tables: string[];
  version?: string;
}> {
  const initialized = await isDatabaseInitialized(db);

  if (!initialized) {
    return {
      initialized: false,
      tables: [],
    };
  }

  const tables = await db.manyOrNone<{ table_name: string }>(
    `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
    `
  );

  return {
    initialized: true,
    tables: tables.map((t) => t.table_name),
  };
}

/**
 * Run cleanup tasks (expired cache, old DLQ entries, etc.)
 */
export async function runCleanupTasks(
  db: Database,
  options?: {
    dlqRetentionDays?: number;
  }
): Promise<{
  expiredCacheDeleted: number;
  oldDlqDeleted: number;
}> {
  console.log('[db] Running cleanup tasks...');

  // Cleanup expired idempotency cache
  const expiredCacheDeleted = await db.func<number>('cleanup_expired_idempotency_cache');

  // Cleanup old DLQ entries
  const dlqRetentionDays = options?.dlqRetentionDays ?? 30;
  const oldDlqDeleted = await db.result(
    `DELETE FROM dlq WHERE failed_at < NOW() - INTERVAL '${dlqRetentionDays} days'`,
    [],
    (r) => r.rowCount
  );

  console.log('[db] Cleanup complete:', {
    expiredCacheDeleted,
    oldDlqDeleted,
  });

  return {
    expiredCacheDeleted,
    oldDlqDeleted,
  };
}
