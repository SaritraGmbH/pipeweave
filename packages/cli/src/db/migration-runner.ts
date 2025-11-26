import type { Database } from './index.js';
import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createHash } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================================
// Types
// ============================================================================

export interface Migration {
  version: string;
  name: string;
  filename: string;
  sql: string;
  checksum: string;
}

export interface AppliedMigration {
  id: number;
  version: string;
  name: string;
  applied_at: Date;
  checksum: string;
  execution_time_ms: number;
}

export interface MigrationStatus {
  pending: Migration[];
  applied: AppliedMigration[];
  current: string | null;
}

// ============================================================================
// Migration Discovery
// ============================================================================

/**
 * Get all migration files from the migrations directory
 */
export function discoverMigrations(): Migration[] {
  const migrationsDir = join(__dirname, 'migrations');
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort(); // Natural sort: 000_, 001_, 002_, etc.

  const migrations: Migration[] = [];

  for (const filename of files) {
    const filepath = join(migrationsDir, filename);
    const sql = readFileSync(filepath, 'utf-8');

    // Extract version and name from filename: 001_initial_schema.sql
    const match = filename.match(/^(\d+)_(.+)\.sql$/);
    if (!match) {
      console.warn(`[migrations] Skipping invalid migration file: ${filename}`);
      continue;
    }

    const [, version, name] = match;
    const checksum = createHash('sha256').update(sql).digest('hex');

    migrations.push({
      version: version!,
      name: name!,
      filename,
      sql,
      checksum,
    });
  }

  return migrations;
}

// ============================================================================
// Migration State
// ============================================================================

/**
 * Check if migration tracking table exists
 */
export async function isMigrationTrackingInitialized(db: Database): Promise<boolean> {
  try {
    const result = await db.oneOrNone(
      `
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'schema_migrations'
      ) as exists
      `
    );
    return result?.exists ?? false;
  } catch (error) {
    return false;
  }
}

/**
 * Get all applied migrations
 */
export async function getAppliedMigrations(db: Database): Promise<AppliedMigration[]> {
  const initialized = await isMigrationTrackingInitialized(db);
  if (!initialized) {
    return [];
  }

  return await db.manyOrNone<AppliedMigration>(
    'SELECT * FROM schema_migrations ORDER BY version ASC'
  );
}

/**
 * Get migration status (pending vs applied)
 */
export async function getMigrationStatus(db: Database): Promise<MigrationStatus> {
  const allMigrations = discoverMigrations();
  const appliedMigrations = await getAppliedMigrations(db);

  const appliedVersions = new Set(appliedMigrations.map((m) => m.version));
  const pending = allMigrations.filter((m) => !appliedVersions.has(m.version));

  const current = appliedMigrations.length > 0
    ? appliedMigrations[appliedMigrations.length - 1]!.version
    : null;

  return {
    pending,
    applied: appliedMigrations,
    current,
  };
}

// ============================================================================
// Migration Execution
// ============================================================================

/**
 * Apply a single migration
 */
async function applyMigration(db: Database, migration: Migration): Promise<void> {
  const startTime = Date.now();

  console.log(`[migrations] Applying ${migration.version}_${migration.name}...`);

  await db.tx(async (t) => {
    // Execute migration SQL
    await t.none(migration.sql);

    // Record in migration tracking table
    await t.none(
      `INSERT INTO schema_migrations (version, name, checksum, execution_time_ms)
       VALUES ($1, $2, $3, $4)`,
      [migration.version, migration.name, migration.checksum, Date.now() - startTime]
    );
  });

  const executionTime = Date.now() - startTime;
  console.log(`[migrations] ✓ Applied ${migration.version}_${migration.name} (${executionTime}ms)`);
}

/**
 * Run all pending migrations
 */
export async function runMigrations(db: Database): Promise<{
  applied: number;
  skipped: number;
}> {
  console.log('[migrations] Checking migration status...\n');

  // Discover all migrations
  const allMigrations = discoverMigrations();
  console.log(`[migrations] Found ${allMigrations.length} migration files`);

  // Ensure migration tracking table exists (run 000_ first if needed)
  const trackingInitialized = await isMigrationTrackingInitialized(db);
  if (!trackingInitialized) {
    const trackingMigration = allMigrations.find((m) => m.version === '000');
    if (trackingMigration) {
      console.log('[migrations] Initializing migration tracking...\n');
      await db.none(trackingMigration.sql);
      console.log('[migrations] ✓ Migration tracking initialized\n');
    } else {
      throw new Error('Migration tracking file (000_migration_tracking.sql) not found');
    }
  }

  // Get status
  const status = await getMigrationStatus(db);

  if (status.pending.length === 0) {
    console.log('[migrations] ✓ All migrations up to date');
    return { applied: 0, skipped: status.applied.length };
  }

  console.log(`[migrations] Current version: ${status.current || 'none'}`);
  console.log(`[migrations] Pending migrations: ${status.pending.length}\n`);

  // Verify checksums of applied migrations
  for (const applied of status.applied) {
    const migration = allMigrations.find((m) => m.version === applied.version);
    if (migration && migration.checksum !== applied.checksum) {
      throw new Error(
        `Migration ${applied.version} has been modified (checksum mismatch). ` +
        `This is dangerous and not supported.`
      );
    }
  }

  // Apply pending migrations in order
  let appliedCount = 0;
  for (const migration of status.pending) {
    await applyMigration(db, migration);
    appliedCount++;
  }

  console.log(`\n[migrations] ✓ Applied ${appliedCount} migration(s)`);

  return {
    applied: appliedCount,
    skipped: status.applied.length,
  };
}

/**
 * Rollback the last migration (DANGEROUS - use with caution)
 */
export async function rollbackMigration(db: Database): Promise<void> {
  const applied = await getAppliedMigrations(db);

  if (applied.length === 0) {
    throw new Error('No migrations to rollback');
  }

  const lastMigration = applied[applied.length - 1]!;

  console.log(`[migrations] Rolling back ${lastMigration.version}_${lastMigration.name}...`);
  console.log('[migrations] ⚠ WARNING: This will DROP ALL TABLES and reapply migrations');
  console.log('[migrations] ⚠ ALL DATA WILL BE LOST');

  throw new Error(
    'Rollback not implemented. Use `pipeweave db:reset` to drop all tables and reapply migrations.'
  );
}

// ============================================================================
// Migration Validation
// ============================================================================

/**
 * Validate migration files without applying them
 */
export async function validateMigrations(db: Database): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  // Check all migration files exist and are valid
  const migrations = discoverMigrations();

  if (migrations.length === 0) {
    errors.push('No migration files found');
    return { valid: false, errors };
  }

  // Check for duplicate versions
  const versions = migrations.map((m) => m.version);
  const duplicates = versions.filter((v, i) => versions.indexOf(v) !== i);
  if (duplicates.length > 0) {
    errors.push(`Duplicate migration versions: ${duplicates.join(', ')}`);
  }

  // Check for gaps in version numbers
  const versionNumbers = versions.map((v) => parseInt(v, 10)).sort((a, b) => a - b);
  for (let i = 0; i < versionNumbers.length - 1; i++) {
    if (versionNumbers[i + 1]! !== versionNumbers[i]! + 1) {
      errors.push(`Gap in migration versions: ${versionNumbers[i]} -> ${versionNumbers[i + 1]}`);
    }
  }

  // Check applied migrations against files
  try {
    const applied = await getAppliedMigrations(db);

    for (const appliedMig of applied) {
      const migration = migrations.find((m) => m.version === appliedMig.version);

      if (!migration) {
        errors.push(`Applied migration ${appliedMig.version} not found in migration files`);
        continue;
      }

      if (migration.checksum !== appliedMig.checksum) {
        errors.push(
          `Migration ${appliedMig.version} has been modified (checksum mismatch)`
        );
      }
    }
  } catch (error) {
    // Database might not be initialized yet - that's okay
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
