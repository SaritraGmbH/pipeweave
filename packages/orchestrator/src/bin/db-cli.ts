#!/usr/bin/env node

/**
 * Database CLI for PipeWeave Orchestrator
 * Manages database schema initialization, migrations, and maintenance
 */

import { program } from 'commander';
import { createDatabase, createDatabaseFromEnv, testConnection, closeDatabase } from '../db/index.js';
import {
  initializeSchema,
  isDatabaseInitialized,
  getDatabaseStatus,
  resetDatabase,
  dropAllTables,
  runCleanupTasks,
} from '../db/migrations.js';

program
  .name('pipeweave-db')
  .description('PipeWeave database management CLI')
  .version('0.1.0');

// ============================================================================
// db init - Initialize database schema
// ============================================================================

program
  .command('init')
  .description('Initialize database schema')
  .option('--url <url>', 'Database connection URL')
  .option('--host <host>', 'Database host')
  .option('--port <port>', 'Database port', '5432')
  .option('--database <database>', 'Database name')
  .option('--user <user>', 'Database user')
  .option('--password <password>', 'Database password')
  .option('--ssl', 'Enable SSL connection')
  .action(async (options) => {
    try {
      console.log('[db] Initializing database schema...\n');

      const db = options.url
        ? createDatabase({ connectionString: options.url })
        : options.host && options.database && options.user
        ? createDatabase({
            host: options.host,
            port: parseInt(options.port),
            database: options.database,
            user: options.user,
            password: options.password,
            ssl: options.ssl ? { rejectUnauthorized: false } : undefined,
          })
        : createDatabaseFromEnv();

      // Test connection
      const connected = await testConnection(db);
      if (!connected) {
        throw new Error('Database connection failed');
      }
      console.log('✓ Connected to database\n');

      // Check if already initialized
      const initialized = await isDatabaseInitialized(db);
      if (initialized) {
        console.log('⚠ Database schema already initialized');
        const status = await getDatabaseStatus(db);
        console.log(`Found ${status.tables.length} tables:`, status.tables.join(', '));
        closeDatabase(db);
        process.exit(0);
      }

      // Initialize schema
      await initializeSchema(db);

      // Verify
      const status = await getDatabaseStatus(db);
      console.log(`\n✓ Schema initialized successfully`);
      console.log(`Created ${status.tables.length} tables:`, status.tables.join(', '));

      closeDatabase(db);
      process.exit(0);
    } catch (error) {
      console.error('\n✗ Error:', error);
      process.exit(1);
    }
  });

// ============================================================================
// db status - Show database status
// ============================================================================

program
  .command('status')
  .description('Show database status')
  .option('--url <url>', 'Database connection URL')
  .option('--host <host>', 'Database host')
  .option('--port <port>', 'Database port', '5432')
  .option('--database <database>', 'Database name')
  .option('--user <user>', 'Database user')
  .option('--password <password>', 'Database password')
  .option('--ssl', 'Enable SSL connection')
  .action(async (options) => {
    try {
      const db = options.url
        ? createDatabase({ connectionString: options.url })
        : options.host && options.database && options.user
        ? createDatabase({
            host: options.host,
            port: parseInt(options.port),
            database: options.database,
            user: options.user,
            password: options.password,
            ssl: options.ssl ? { rejectUnauthorized: false } : undefined,
          })
        : createDatabaseFromEnv();

      // Test connection
      const connected = await testConnection(db);
      if (!connected) {
        throw new Error('Database connection failed');
      }

      const status = await getDatabaseStatus(db);

      console.log('\n=== Database Status ===\n');
      console.log(`Initialized: ${status.initialized ? '✓ Yes' : '✗ No'}`);

      if (status.initialized) {
        console.log(`Tables (${status.tables.length}):`);
        status.tables.forEach((table) => console.log(`  • ${table}`));
      }

      closeDatabase(db);
      process.exit(0);
    } catch (error) {
      console.error('\n✗ Error:', error);
      process.exit(1);
    }
  });

// ============================================================================
// db reset - Reset database (DESTRUCTIVE)
// ============================================================================

program
  .command('reset')
  .description('Reset database - drops and recreates all tables (DESTRUCTIVE)')
  .option('--url <url>', 'Database connection URL')
  .option('--host <host>', 'Database host')
  .option('--port <port>', 'Database port', '5432')
  .option('--database <database>', 'Database name')
  .option('--user <user>', 'Database user')
  .option('--password <password>', 'Database password')
  .option('--ssl', 'Enable SSL connection')
  .option('--yes', 'Skip confirmation prompt')
  .action(async (options) => {
    try {
      if (!options.yes) {
        console.log('⚠ WARNING: This will DROP ALL TABLES and recreate the schema.');
        console.log('⚠ ALL DATA WILL BE LOST!');
        console.log('\nUse --yes flag to confirm.');
        process.exit(1);
      }

      console.log('[db] Resetting database...\n');

      const db = options.url
        ? createDatabase({ connectionString: options.url })
        : options.host && options.database && options.user
        ? createDatabase({
            host: options.host,
            port: parseInt(options.port),
            database: options.database,
            user: options.user,
            password: options.password,
            ssl: options.ssl ? { rejectUnauthorized: false } : undefined,
          })
        : createDatabaseFromEnv();

      // Test connection
      const connected = await testConnection(db);
      if (!connected) {
        throw new Error('Database connection failed');
      }

      await resetDatabase(db);

      const status = await getDatabaseStatus(db);
      console.log(`\n✓ Database reset complete`);
      console.log(`Created ${status.tables.length} tables:`, status.tables.join(', '));

      closeDatabase(db);
      process.exit(0);
    } catch (error) {
      console.error('\n✗ Error:', error);
      process.exit(1);
    }
  });

// ============================================================================
// db cleanup - Run cleanup tasks
// ============================================================================

program
  .command('cleanup')
  .description('Run cleanup tasks (expired cache, old DLQ entries)')
  .option('--url <url>', 'Database connection URL')
  .option('--host <host>', 'Database host')
  .option('--port <port>', 'Database port', '5432')
  .option('--database <database>', 'Database name')
  .option('--user <user>', 'Database user')
  .option('--password <password>', 'Database password')
  .option('--ssl', 'Enable SSL connection')
  .option('--dlq-retention-days <days>', 'DLQ retention in days', '30')
  .action(async (options) => {
    try {
      console.log('[db] Running cleanup tasks...\n');

      const db = options.url
        ? createDatabase({ connectionString: options.url })
        : options.host && options.database && options.user
        ? createDatabase({
            host: options.host,
            port: parseInt(options.port),
            database: options.database,
            user: options.user,
            password: options.password,
            ssl: options.ssl ? { rejectUnauthorized: false } : undefined,
          })
        : createDatabaseFromEnv();

      // Test connection
      const connected = await testConnection(db);
      if (!connected) {
        throw new Error('Database connection failed');
      }

      const result = await runCleanupTasks(db, {
        dlqRetentionDays: parseInt(options.dlqRetentionDays),
      });

      console.log(`\n✓ Cleanup complete`);
      console.log(`  • Expired cache entries deleted: ${result.expiredCacheDeleted}`);
      console.log(`  • Old DLQ entries deleted: ${result.oldDlqDeleted}`);

      closeDatabase(db);
      process.exit(0);
    } catch (error) {
      console.error('\n✗ Error:', error);
      process.exit(1);
    }
  });

program.parse();
