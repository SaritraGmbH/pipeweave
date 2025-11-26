#!/usr/bin/env node

/**
 * Database connection test script
 * Tests both connectionString and individual credentials authentication methods
 */

import { createDatabase, testConnection, closeDatabase } from '../db/index.js';
import { initializeSchema, getDatabaseStatus, resetDatabase } from '../db/migrations.js';

async function testConnectionString() {
  console.log('\n=== Testing Connection String Method ===');

  const connectionString =
    process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/pipeweave_test';

  console.log(`Connection string: ${connectionString.replace(/:[^:@]+@/, ':****@')}`);

  try {
    const db = createDatabase({ connectionString });

    const connected = await testConnection(db);
    if (connected) {
      console.log('✓ Connection successful!');

      // Get database status
      const status = await getDatabaseStatus(db);
      console.log('Database status:', status);

      closeDatabase(db);
      return true;
    } else {
      console.log('✗ Connection failed');
      closeDatabase(db);
      return false;
    }
  } catch (error) {
    console.error('✗ Error:', error);
    return false;
  }
}

async function testIndividualCredentials() {
  console.log('\n=== Testing Individual Credentials Method ===');

  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432;
  const database = process.env.DB_NAME || process.env.DB_DATABASE || 'pipeweave_test';
  const user = process.env.DB_USER || process.env.DB_USERNAME || 'postgres';
  const password = process.env.DB_PASS || process.env.DB_PASSWORD || 'postgres';

  console.log(`Host: ${host}`);
  console.log(`Port: ${port}`);
  console.log(`Database: ${database}`);
  console.log(`User: ${user}`);
  console.log(`Password: ${'*'.repeat(password.length)}`);

  try {
    const db = createDatabase({
      host,
      port,
      database,
      user,
      password,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    });

    const connected = await testConnection(db);
    if (connected) {
      console.log('✓ Connection successful!');

      // Get database status
      const status = await getDatabaseStatus(db);
      console.log('Database status:', status);

      closeDatabase(db);
      return true;
    } else {
      console.log('✗ Connection failed');
      closeDatabase(db);
      return false;
    }
  } catch (error) {
    console.error('✗ Error:', error);
    return false;
  }
}

async function testSchemaInitialization() {
  console.log('\n=== Testing Schema Initialization ===');

  const connectionString =
    process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/pipeweave_test';

  try {
    const db = createDatabase({ connectionString });

    const connected = await testConnection(db);
    if (!connected) {
      console.log('✗ Connection failed');
      closeDatabase(db);
      return false;
    }

    // Check current status
    let status = await getDatabaseStatus(db);
    console.log('Initial status:', status);

    if (!status.initialized) {
      console.log('Initializing schema...');
      await initializeSchema(db);
      status = await getDatabaseStatus(db);
      console.log('✓ Schema initialized');
      console.log('Tables created:', status.tables);
    } else {
      console.log('✓ Schema already initialized');
      console.log('Existing tables:', status.tables);
    }

    closeDatabase(db);
    return true;
  } catch (error) {
    console.error('✗ Error:', error);
    return false;
  }
}

async function main() {
  console.log('PipeWeave Database Connection Test');
  console.log('===================================\n');

  const results = {
    connectionString: false,
    individualCredentials: false,
    schemaInit: false,
  };

  // Test connection string method
  if (process.env.DATABASE_URL) {
    results.connectionString = await testConnectionString();
  } else {
    console.log('\n=== Skipping Connection String Test ===');
    console.log('(Set DATABASE_URL to test this method)');
  }

  // Test individual credentials method
  if (process.env.DB_HOST || process.env.DB_USER) {
    results.individualCredentials = await testIndividualCredentials();
  } else {
    console.log('\n=== Skipping Individual Credentials Test ===');
    console.log('(Set DB_HOST, DB_NAME, DB_USER, DB_PASS to test this method)');
  }

  // Test schema initialization
  if (process.env.DATABASE_URL || process.env.DB_HOST) {
    results.schemaInit = await testSchemaInitialization();
  }

  // Summary
  console.log('\n=== Test Summary ===');
  console.log(`Connection String: ${results.connectionString ? '✓ PASS' : '- SKIP'}`);
  console.log(`Individual Credentials: ${results.individualCredentials ? '✓ PASS' : '- SKIP'}`);
  console.log(`Schema Initialization: ${results.schemaInit ? '✓ PASS' : '- SKIP'}`);

  const allPassed = Object.values(results).every((r) => r === true || r === false);
  const anyFailed = Object.values(results).some((r) => r === false);

  if (anyFailed) {
    console.log('\n❌ Some tests failed or were skipped');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
