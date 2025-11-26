# PipeWeave Orchestrator - Database Setup

This document describes the database setup and configuration for the PipeWeave orchestrator using `pg-promise`.

## Database Connection

The orchestrator supports two methods for database authentication:

### Method 1: Connection String (Recommended)

Use a single `DATABASE_URL` environment variable:

```bash
# Local development
DATABASE_URL=postgres://user:password@localhost:5432/pipeweave

# Production with SSL
DATABASE_URL=postgres://user:password@host:5432/pipeweave?sslmode=require

# Cloud SQL Unix socket (Google Cloud)
DATABASE_URL=postgres://user:password@/pipeweave?host=/cloudsql/project:region:instance
```

### Method 2: Individual Credentials

Use separate environment variables for each connection parameter:

```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pipeweave
DB_USER=postgres
DB_PASS=your-password

# Optional
DB_SSL=true  # Enable SSL with relaxed validation
DB_POOL_MAX=10  # Maximum connections in pool
DB_ALLOW_EXIT_ON_IDLE=true  # Allow pool to exit when idle (serverless)
```

**Note:** For Google Cloud SQL with Unix sockets in production, set `DB_HOST=/cloudsql/PROJECT:REGION:INSTANCE`.

## Environment Variables

| Variable                 | Required | Default | Description                                  |
| ------------------------ | -------- | ------- | -------------------------------------------- |
| `DATABASE_URL`           | Yes*     | —       | Full PostgreSQL connection string            |
| `DB_HOST`                | Yes*     | —       | Database host or Unix socket path            |
| `DB_PORT`                | No       | `5432`  | Database port                                |
| `DB_NAME` / `DB_DATABASE`| Yes*     | —       | Database name                                |
| `DB_USER` / `DB_USERNAME`| Yes*     | —       | Database user                                |
| `DB_PASS` / `DB_PASSWORD`| No       | —       | Database password                            |
| `DB_SSL`                 | No       | —       | Enable SSL (`true` for SSL)                  |
| `DB_POOL_MAX`            | No       | `10`    | Maximum pool connections                     |
| `DB_ALLOW_EXIT_ON_IDLE`  | No       | `false` | Allow pool to exit on idle                   |
| `AUTO_INIT_DB`           | No       | `false` | Auto-initialize schema on orchestrator start |

*Either `DATABASE_URL` or (`DB_HOST`, `DB_NAME`, `DB_USER`) must be provided.

## Database Schema

The orchestrator creates the following tables:

| Table                  | Description                              |
| ---------------------- | ---------------------------------------- |
| `services`             | Registered worker services               |
| `tasks`                | Task definitions with code hashes        |
| `task_code_history`    | Task code change audit log               |
| `pipelines`            | Pipeline definitions                     |
| `pipeline_runs`        | Pipeline execution tracking              |
| `task_runs`            | Individual task executions               |
| `dlq`                  | Dead letter queue (failed tasks)         |
| `idempotency_cache`    | Cached results for idempotent tasks      |

## CLI Commands

### Initialize Database

Create all tables and schema:

```bash
# Using DATABASE_URL
pipeweave-db init --url postgres://user:pass@localhost:5432/pipeweave

# Using individual credentials
pipeweave-db init \
  --host localhost \
  --port 5432 \
  --database pipeweave \
  --user postgres \
  --password mypassword

# Using environment variables
pipeweave-db init
```

### Check Database Status

View current database state:

```bash
pipeweave-db status --url $DATABASE_URL

# Output:
# === Database Status ===
#
# Initialized: ✓ Yes
# Tables (8):
#   • dlq
#   • idempotency_cache
#   • pipeline_runs
#   • pipelines
#   • services
#   • task_code_history
#   • task_runs
#   • tasks
```

### Reset Database (DESTRUCTIVE)

Drop all tables and recreate schema:

```bash
pipeweave-db reset --url $DATABASE_URL --yes

# ⚠ WARNING: This will delete all data!
```

### Cleanup Tasks

Remove expired cache and old DLQ entries:

```bash
pipeweave-db cleanup --url $DATABASE_URL --dlq-retention-days 30

# Output:
# ✓ Cleanup complete
#   • Expired cache entries deleted: 15
#   • Old DLQ entries deleted: 3
```

## Testing Database Connection

Test both authentication methods:

```bash
# Test connection string
DATABASE_URL=postgres://user:pass@localhost:5432/pipeweave pipeweave-test-db

# Test individual credentials
DB_HOST=localhost \
DB_NAME=pipeweave \
DB_USER=postgres \
DB_PASS=mypassword \
pipeweave-test-db
```

## Programmatic Usage

### Basic Connection

```typescript
import { createDatabase, testConnection } from '@pipeweave/orchestrator';

// Method 1: Connection string
const db = createDatabase({
  connectionString: 'postgres://user:pass@localhost:5432/pipeweave',
});

// Method 2: Individual credentials
const db = createDatabase({
  host: 'localhost',
  port: 5432,
  database: 'pipeweave',
  user: 'postgres',
  password: 'mypassword',
  ssl: { rejectUnauthorized: false },
  max: 10,
});

// Test connection
const connected = await testConnection(db);
if (!connected) {
  throw new Error('Database connection failed');
}
```

### Initialize Schema

```typescript
import { initializeSchema, isDatabaseInitialized } from '@pipeweave/orchestrator';

const initialized = await isDatabaseInitialized(db);
if (!initialized) {
  await initializeSchema(db);
  console.log('Schema initialized');
}
```

### Query Database

```typescript
// Get all services
const services = await db.manyOrNone('SELECT * FROM services WHERE status = $1', ['active']);

// Get single task
const task = await db.oneOrNone('SELECT * FROM tasks WHERE id = $1', ['my-task']);

// Insert with returning
const result = await db.one(
  'INSERT INTO services (id, version, base_url) VALUES ($1, $2, $3) RETURNING *',
  ['my-service', '1.0.0', 'http://localhost:8080']
);

// Transaction
await db.tx(async (t) => {
  await t.none('INSERT INTO services ...');
  await t.none('INSERT INTO tasks ...');
});
```

### Close Connection

```typescript
import { closeDatabase } from '@pipeweave/orchestrator';

closeDatabase(db);
```

## SSL Configuration

### Local Development (No SSL)

```bash
DATABASE_URL=postgres://user:pass@localhost:5432/pipeweave
```

### Production (SSL Required)

```bash
DATABASE_URL=postgres://user:pass@host:5432/pipeweave
NODE_ENV=production
```

or

```bash
DB_HOST=my-db-host.example.com
DB_SSL=true
```

### Google Cloud SQL (Unix Socket)

```bash
# Production (no SSL needed for Unix socket)
DB_HOST=/cloudsql/my-project:us-central1:my-instance
DB_NAME=pipeweave
DB_USER=postgres
DB_PASS=password
NODE_ENV=production
```

## Pool Configuration

### Default Settings

- **Max connections**: 10
- **Allow exit on idle**: false

### Serverless Environments

For serverless deployments (Cloud Run, Lambda), allow the pool to exit when idle:

```bash
DB_ALLOW_EXIT_ON_IDLE=true
```

or

```typescript
const db = createDatabase({
  connectionString: process.env.DATABASE_URL,
  allowExitOnIdle: true,
  max: 2, // Lower max for serverless
});
```

## Migration from Drizzle ORM

If you're migrating from the old Drizzle ORM setup:

1. **Update dependencies**: Run `npm install` to install `pg-promise`
2. **Initialize schema**: Run `pipeweave-db init`
3. **Update imports**: Change from `drizzle-orm` to `@pipeweave/orchestrator` database exports
4. **Update queries**: Convert Drizzle queries to pg-promise SQL

Example migration:

```typescript
// Before (Drizzle)
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);

const services = await db.select().from(servicesTable);

// After (pg-promise)
import { createDatabaseFromEnv } from '@pipeweave/orchestrator';

const db = createDatabaseFromEnv();

const services = await db.manyOrNone('SELECT * FROM services');
```

## Troubleshooting

### Connection Refused

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution**: Ensure PostgreSQL is running:

```bash
# Start PostgreSQL (macOS with Homebrew)
brew services start postgresql

# Or with Docker
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:15
```

### Authentication Failed

```
Error: password authentication failed for user "postgres"
```

**Solution**: Check username and password in your connection config.

### Database Does Not Exist

```
Error: database "pipeweave" does not exist
```

**Solution**: Create the database first:

```bash
createdb pipeweave

# Or with Docker
docker exec -it <container> psql -U postgres -c "CREATE DATABASE pipeweave;"
```

### SSL Required

```
Error: no pg_hba.conf entry for host
```

**Solution**: Enable SSL in your connection config:

```bash
DB_SSL=true
```

or

```bash
DATABASE_URL=postgres://user:pass@host:5432/db?sslmode=require
```

## Example Configurations

### Local Development

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/pipeweave_dev
AUTO_INIT_DB=true
```

### Docker Compose

```yaml
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: pipeweave
      POSTGRES_USER: pipeweave
      POSTGRES_PASSWORD: pipeweave
    ports:
      - "5432:5432"

  orchestrator:
    build: .
    environment:
      DATABASE_URL: postgres://pipeweave:pipeweave@postgres:5432/pipeweave
      AUTO_INIT_DB: true
    depends_on:
      - postgres
```

### Google Cloud Run (Cloud SQL)

```bash
DB_HOST=/cloudsql/my-project:us-central1:my-instance
DB_NAME=pipeweave
DB_USER=postgres
DB_PASS=${DB_PASSWORD}  # From Secret Manager
NODE_ENV=production
DB_ALLOW_EXIT_ON_IDLE=true
DB_POOL_MAX=2
AUTO_INIT_DB=false
```

## Best Practices

1. **Use connection strings**: Easier to manage, especially with cloud providers
2. **Enable SSL in production**: Always use SSL for remote connections
3. **Set pool size appropriately**: Lower for serverless (2-5), higher for long-running (10-20)
4. **Initialize schema separately**: Don't use `AUTO_INIT_DB=true` in production
5. **Run cleanup regularly**: Schedule `pipeweave-db cleanup` to remove stale data
6. **Use transactions**: Wrap multi-step operations in `db.tx()`
7. **Handle errors**: Always wrap database calls in try/catch blocks

## Reference

- **pg-promise docs**: https://github.com/vitaly-t/pg-promise
- **PostgreSQL connection strings**: https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING
