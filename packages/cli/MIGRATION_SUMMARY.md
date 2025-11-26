# Migration to pg-promise - Summary

This document summarizes the migration from Drizzle ORM to pg-promise for database operations in the PipeWeave orchestrator.

## Changes Made

### 1. Dependencies Updated

**Removed:**
- `drizzle-orm` (^0.29.1)
- `postgres` (^3.4.3)
- `drizzle-kit` (^0.20.9)

**Added:**
- `pg-promise` (^11.5.4)
- `commander` (^11.1.0)
- `@types/pg` (^8.10.9)

### 2. New Database Module

Created comprehensive database layer at `src/db/`:

#### `src/db/index.ts`
- `initializePgPromise()` - Initialize pg-promise with custom config
- `createDatabase()` - Create database connection with support for:
  - **Connection string** (recommended)
  - **Individual credentials** (host, port, database, user, password)
- `createDatabaseFromEnv()` - Parse from environment variables
- `testConnection()` - Verify database connectivity
- `closeDatabase()` - Clean shutdown

**Key Features:**
- Automatic SSL configuration based on environment
- Cloud SQL Unix socket support (Google Cloud)
- Configurable connection pool
- Timezone fix for timestamp fields

#### `src/db/schema.sql`
Complete PostgreSQL schema with:
- 8 tables: services, tasks, task_code_history, pipelines, pipeline_runs, task_runs, dlq, idempotency_cache
- Indexes for performance
- Triggers for automatic timestamps
- Constraints and foreign keys
- Cleanup functions

#### `src/db/migrations.ts`
Migration and maintenance utilities:
- `initializeSchema()` - Create all tables from SQL file
- `isDatabaseInitialized()` - Check if schema exists
- `getDatabaseStatus()` - Get current state
- `dropAllTables()` - Reset database (destructive)
- `resetDatabase()` - Drop and recreate
- `runCleanupTasks()` - Remove expired cache and old DLQ entries

### 3. Orchestrator Updates

**Enhanced `src/orchestrator.ts`:**

```typescript
interface OrchestratorConfig {
  // New: Support both auth methods
  databaseUrl?: string;
  databaseConfig?: DatabaseConfig;

  // New: Auto-initialize schema on startup
  autoInitDb?: boolean;

  // Existing storage and other config...
}
```

**Key Changes:**
- Accept either `databaseUrl` OR `databaseConfig`
- Initialize database connection in `start()`
- Test connection and verify schema
- Graceful shutdown with connection cleanup
- New `getDatabase()` method to access db instance

**Environment Config:**
- Parse `DATABASE_URL` or individual `DB_*` variables
- Intelligent SSL configuration:
  - Production + Unix socket = no SSL
  - Production + remote = SSL with relaxed validation
  - Development = SSL if `DB_SSL=true`

### 4. CLI Tools

#### `src/bin/db-cli.ts`
Database management CLI with commands:

```bash
pipeweave-db init      # Initialize schema
pipeweave-db status    # Show database state
pipeweave-db reset     # Drop and recreate (destructive)
pipeweave-db cleanup   # Remove stale data
```

Supports both connection methods via flags:
- `--url <connection-string>`
- `--host`, `--port`, `--database`, `--user`, `--password`, `--ssl`

#### `src/bin/test-db.ts`
Comprehensive test script:
- Tests connection string authentication
- Tests individual credentials authentication
- Verifies schema initialization
- Displays detailed error messages

### 5. Updated Exports

**`src/index.ts`** now exports:
- Database functions: `createDatabase`, `createDatabaseFromEnv`, `testConnection`, `closeDatabase`
- Migration functions: `initializeSchema`, `isDatabaseInitialized`, `getDatabaseStatus`, etc.
- Types: `Database`, `DatabaseConfig`

### 6. Documentation

Created `DATABASE.md` with:
- Complete setup instructions
- Both authentication methods documented
- Environment variable reference
- CLI command examples
- Programmatic usage examples
- SSL configuration guide
- Troubleshooting section
- Best practices

## Authentication Methods

### Method 1: Connection String (Recommended)

```bash
# Environment variable
DATABASE_URL=postgres://user:password@localhost:5432/pipeweave

# Programmatic
createDatabase({ connectionString: process.env.DATABASE_URL })
```

**Advantages:**
- Single variable to manage
- Standard format
- Easy to use with cloud providers
- Supports query parameters (SSL, timeout, etc.)

### Method 2: Individual Credentials

```bash
# Environment variables
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pipeweave
DB_USER=postgres
DB_PASS=password

# Programmatic
createDatabase({
  host: 'localhost',
  port: 5432,
  database: 'pipeweave',
  user: 'postgres',
  password: 'password'
})
```

**Advantages:**
- Easier to manage individual secrets
- Works with Cloud SQL Unix sockets
- Granular control over each parameter

## Database Schema

All tables follow the specification from `SPEC.md`:

1. **services** - Registered workers with heartbeat tracking
2. **tasks** - Task definitions with code hashing and versioning
3. **task_code_history** - Audit log of code changes
4. **pipelines** - Pipeline definitions and structure
5. **pipeline_runs** - Pipeline execution state
6. **task_runs** - Individual task execution tracking
7. **dlq** - Dead letter queue for failed tasks
8. **idempotency_cache** - Cached results with TTL

## Usage Examples

### Basic Setup

```typescript
import { createDatabase, initializeSchema, isDatabaseInitialized } from '@pipeweave/orchestrator';

const db = createDatabase({
  connectionString: process.env.DATABASE_URL
});

// Initialize schema if needed
if (!await isDatabaseInitialized(db)) {
  await initializeSchema(db);
}

// Use database
const services = await db.manyOrNone('SELECT * FROM services');
```

### Orchestrator Integration

```typescript
import { createOrchestrator } from '@pipeweave/orchestrator';

const orchestrator = createOrchestrator({
  // Database via connection string
  databaseUrl: process.env.DATABASE_URL,

  // OR via individual credentials
  databaseConfig: {
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
  },

  // Auto-initialize schema (dev only)
  autoInitDb: process.env.NODE_ENV !== 'production',

  // Storage and other config...
  storageBackends: [...],
  secretKey: process.env.PIPEWEAVE_SECRET_KEY,
});

await orchestrator.start();

// Access database
const db = orchestrator.getDatabase();
const tasks = await db.manyOrNone('SELECT * FROM tasks');
```

### Cloud SQL (Google Cloud)

**Production with Unix socket:**
```bash
DB_HOST=/cloudsql/my-project:us-central1:instance
DB_NAME=pipeweave
DB_USER=postgres
DB_PASS=secret
NODE_ENV=production
```

SSL is automatically disabled for Unix socket connections.

## Migration Steps

If you have an existing Drizzle ORM setup:

1. **Update dependencies:**
   ```bash
   cd packages/orchestrator
   npm install
   ```

2. **Initialize database:**
   ```bash
   npx pipeweave-db init --url $DATABASE_URL
   ```

3. **Test connection:**
   ```bash
   npx pipeweave-test-db
   ```

4. **Update code:**
   - Replace `drizzle` imports with `@pipeweave/orchestrator`
   - Convert Drizzle queries to pg-promise SQL
   - Use `db.manyOrNone()`, `db.one()`, etc.

5. **Start orchestrator:**
   ```bash
   npm run dev
   ```

## Features

### Connection Pooling
- Configurable pool size (default: 10)
- Auto-exit on idle for serverless (optional)
- Efficient connection reuse

### SSL Support
- Automatic SSL detection in production
- Cloud SQL Unix socket support
- Configurable validation rules

### Error Handling
- Custom error handler integration
- Query logging
- Connection failure detection

### Maintenance
- Automatic timestamp updates via triggers
- Cleanup functions for expired data
- DLQ retention management

### Type Safety
- Full TypeScript support
- Exported types for all database operations
- Strong typing for query results

## Configuration Reference

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes* | - | PostgreSQL connection string |
| `DB_HOST` | Yes* | - | Database host |
| `DB_PORT` | No | 5432 | Database port |
| `DB_NAME` | Yes* | - | Database name |
| `DB_USER` | Yes* | - | Database user |
| `DB_PASS` | No | - | Database password |
| `DB_SSL` | No | - | Enable SSL (true/false) |
| `DB_POOL_MAX` | No | 10 | Max pool connections |
| `DB_ALLOW_EXIT_ON_IDLE` | No | false | Allow pool exit on idle |
| `AUTO_INIT_DB` | No | false | Auto-initialize schema |

*Either `DATABASE_URL` or (`DB_HOST`, `DB_NAME`, `DB_USER`) required.

## Testing

Run the test script to verify your setup:

```bash
# Test with connection string
DATABASE_URL=postgres://user:pass@localhost:5432/pipeweave npx pipeweave-test-db

# Test with individual credentials
DB_HOST=localhost DB_NAME=pipeweave DB_USER=postgres DB_PASS=secret npx pipeweave-test-db
```

Expected output:
```
PipeWeave Database Connection Test
===================================

=== Testing Connection String Method ===
Connection string: postgres://postgres:****@localhost:5432/pipeweave_test
✓ Connection successful!
Database status: { initialized: true, tables: [...] }

=== Testing Individual Credentials Method ===
Host: localhost
Port: 5432
Database: pipeweave_test
User: postgres
Password: ********
✓ Connection successful!
Database status: { initialized: true, tables: [...] }

=== Test Summary ===
Connection String: ✓ PASS
Individual Credentials: ✓ PASS
Schema Initialization: ✓ PASS

✅ All tests passed!
```

## Next Steps

1. **Install dependencies**: `npm install` in the orchestrator package
2. **Initialize database**: Run `pipeweave-db init`
3. **Test connection**: Run `pipeweave-test-db`
4. **Start orchestrator**: The database will be automatically connected
5. **Build the remaining orchestrator features** using the database instance

## References

- [DATABASE.md](./DATABASE.md) - Detailed database documentation
- [pg-promise documentation](https://github.com/vitaly-t/pg-promise)
- [PostgreSQL documentation](https://www.postgresql.org/docs/)
