# Database Migrations & Maintenance Mode

This guide covers database migrations and maintenance mode management for the PipeWeave orchestrator.

## Table of Contents

- [Database Migrations](#database-migrations)
- [Maintenance Mode](#maintenance-mode)
- [CLI Commands](#cli-commands)
- [Programmatic API](#programmatic-api)
- [Best Practices](#best-practices)

---

## Database Migrations

### Overview

PipeWeave uses a version-based migration system with automatic tracking and validation. All migrations are stored in `src/db/migrations/` and run in order.

### Migration Files

Migrations are SQL files named with a version prefix:

```
src/db/migrations/
  000_migration_tracking.sql  ← Always runs first (creates tracking tables)
  001_initial_schema.sql      ← Initial database schema
  002_add_new_feature.sql     ← Your custom migrations
  003_update_indexes.sql
```

**Naming Convention:**
- Format: `{version}_{description}.sql`
- Version: Zero-padded number (000, 001, 002, etc.)
- Description: Snake_case description

### Migration Tracking

The system automatically tracks:
- ✅ Which migrations have been applied
- ✅ When they were applied
- ✅ Checksums to detect modifications
- ✅ Execution time

### Running Migrations

#### Method 1: CLI (Recommended)

```bash
# Run all pending migrations
pipeweave db:migrate

# Check migration status
pipeweave db:status

# Validate migrations
pipeweave db:validate
```

#### Method 2: Automatic on Startup

Set `AUTO_MIGRATE=true` environment variable:

```bash
export AUTO_MIGRATE=true
npm start
```

**⚠️ Not recommended for production!** Run migrations manually in production.

#### Method 3: Programmatic

```typescript
import { runMigrations, getMigrationStatus } from '@pipeweave/orchestrator';

const db = createDatabase({ connectionString: process.env.DATABASE_URL });

// Check status
const status = await getMigrationStatus(db);
console.log('Pending:', status.pending.length);
console.log('Applied:', status.applied.length);

// Run migrations
const result = await runMigrations(db);
console.log('Applied:', result.applied);
```

### Creating New Migrations

1. **Create migration file:**

```bash
# Create file: src/db/migrations/002_add_user_preferences.sql
cat > src/db/migrations/002_add_user_preferences.sql << 'EOF'
-- Migration: 002_add_user_preferences
-- Description: Add user preferences table
-- Created: 2024-01-15

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT PRIMARY KEY,
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_preferences_created_at ON user_preferences(created_at);
EOF
```

2. **Test migration:**

```bash
# Validate
pipeweave db:validate

# Run
pipeweave db:migrate
```

3. **Verify:**

```bash
pipeweave db:status
```

### Migration Best Practices

✅ **DO:**
- Make migrations idempotent (use `IF NOT EXISTS`)
- Test migrations on a copy of production data
- Keep migrations small and focused
- Include rollback instructions in comments
- Use transactions implicitly (pg-promise wraps in tx)

❌ **DON'T:**
- Modify applied migrations (checksum validation will fail)
- Skip version numbers
- Delete old migrations
- Mix schema and data changes in one migration

---

## Maintenance Mode

### Overview

Maintenance mode allows you to safely perform database operations by preventing new tasks from being queued while waiting for existing tasks to complete.

### State Diagram

```
┌──────────┐
│ running  │ ← Normal operation, accepting new tasks
└────┬─────┘
     │ requestMaintenance()
     ▼
┌────────────────────────┐
│ waiting_for_maintenance│ ← No new tasks, waiting for existing to finish
└────┬───────────────────┘
     │ Auto-transition when all tasks complete
     ▼
┌─────────────┐
│ maintenance │ ← Safe to run migrations
└────┬────────┘
     │ exitMaintenance()
     ▼
┌──────────┐
│ running  │
└──────────┘
```

### Three States

1. **`running`** (Normal Operation)
   - Orchestrator accepts new tasks
   - Tasks are dispatched and executed
   - Default state

2. **`waiting_for_maintenance`** (Draining)
   - New tasks are **rejected**
   - Existing pending tasks continue
   - Running tasks complete
   - Automatically transitions to `maintenance` when:
     - `pending_tasks_count = 0`
     - `running_tasks_count = 0`

3. **`maintenance`** (Safe for Migrations)
   - No tasks running or pending
   - Safe to run database migrations
   - Safe to perform schema changes
   - Must manually exit to resume

### Using Maintenance Mode

#### Workflow

```bash
# 1. Request maintenance mode
pipeweave maintenance:request

# Output:
# [maintenance] ✓ Maintenance mode requested
# Mode: waiting_for_maintenance
# Pending tasks: 5
# Running tasks: 2
# Status: Waiting for 7 tasks to complete

# 2. Wait for auto-transition (or check status)
pipeweave maintenance:status

# Output:
# Mode: maintenance
# Pending tasks: 0
# Running tasks: 0
# Can enter maintenance: Yes
# Status: Maintenance mode active

# 3. Run migrations
pipeweave db:migrate

# 4. Exit maintenance mode
pipeweave maintenance:exit

# Output:
# [maintenance] ✓ Exited maintenance mode
# Orchestrator is now running normally
```

#### Manual Entry (if already waiting)

```bash
# If you're impatient and want to force entry
# (only works if no tasks are running)
pipeweave maintenance:enter
```

### Auto-Transition

The orchestrator automatically checks every 5 seconds (configurable) if it can transition from `waiting_for_maintenance` to `maintenance`.

**Configuration:**

```bash
# Environment variable
MAINTENANCE_CHECK_INTERVAL_MS=5000
```

or programmatically:

```typescript
const orchestrator = createOrchestrator({
  // ...
  maintenanceCheckIntervalMs: 5000, // 5 seconds
});
```

### Orchestrator Integration

The orchestrator automatically:
- ✅ Checks maintenance mode on startup
- ✅ Runs auto-transition check every N milliseconds
- ✅ Logs when transitioning states
- ✅ Stops accepting new tasks when not in `running` mode

```typescript
// In your task dispatch code
const canAccept = await orchestrator.canAcceptTasks();
if (!canAccept) {
  throw new Error('Orchestrator is in maintenance mode');
}
```

---

## CLI Commands

### Migration Commands

#### `pipeweave db:migrate`

Run all pending database migrations.

```bash
# Using DATABASE_URL
pipeweave db:migrate

# Using connection string
pipeweave db:migrate --url postgres://user:pass@host:5432/db

# Using individual credentials
pipeweave db:migrate \
  --host localhost \
  --port 5432 \
  --database pipeweave \
  --user postgres \
  --password secret
```

**Options:**
- `--url <url>` - Database connection URL
- `--host <host>` - Database host
- `--port <port>` - Database port (default: 5432)
- `--database <database>` - Database name
- `--user <user>` - Database user
- `--password <password>` - Database password
- `--ssl` - Enable SSL connection

#### `pipeweave db:status`

Show current migration status.

```bash
pipeweave db:status

# Output:
# === Database Migration Status ===
#
# Current version: 001
# Applied migrations: 2
# Pending migrations: 0
#
# Applied:
#   ✓ 000_migration_tracking (2024-01-15T10:30:00.000Z)
#   ✓ 001_initial_schema (2024-01-15T10:30:05.000Z)
```

#### `pipeweave db:validate`

Validate migration files.

```bash
pipeweave db:validate

# Output:
# === Migration Validation ===
#
# ✓ All migrations are valid
```

#### `pipeweave db:cleanup`

Run cleanup tasks (expired cache, old DLQ entries).

```bash
pipeweave db:cleanup --dlq-retention-days 30

# Output:
# [db] ✓ Cleanup complete
#   • Expired cache entries deleted: 15
#   • Old DLQ entries deleted: 3
```

### Maintenance Commands

#### `pipeweave maintenance:status`

Show current maintenance mode status.

```bash
pipeweave maintenance:status

# Output:
# === Maintenance Mode Status ===
#
# Mode: running
# Pending tasks: 0
# Running tasks: 0
# Can enter maintenance: Yes
# Status: Orchestrator is running normally
# Mode changed at: 2024-01-15T10:00:00.000Z
```

#### `pipeweave maintenance:request`

Request maintenance mode (transition to `waiting_for_maintenance`).

```bash
pipeweave maintenance:request

# Output:
# [maintenance] ✓ Maintenance mode requested
#
# Mode: waiting_for_maintenance
# Pending tasks: 5
# Running tasks: 2
# Status: Waiting for 7 tasks to complete
#
# Waiting for tasks to complete. The orchestrator will auto-transition when ready.
```

#### `pipeweave maintenance:enter`

Force entry to maintenance mode (only if no tasks running).

```bash
pipeweave maintenance:enter

# Output:
# [maintenance] ✓ Entered maintenance mode
#
# No new tasks will be accepted.
# Run migrations or perform maintenance tasks now.
```

#### `pipeweave maintenance:exit`

Exit maintenance mode and resume normal operation.

```bash
pipeweave maintenance:exit

# Output:
# [maintenance] ✓ Exited maintenance mode
#
# Orchestrator is now running normally and accepting new tasks.
```

---

## Programmatic API

### Orchestrator Methods

```typescript
import { createOrchestrator } from '@pipeweave/orchestrator';

const orchestrator = createOrchestrator({
  databaseUrl: process.env.DATABASE_URL,
  autoMigrate: false, // Don't auto-run migrations in production
  maintenanceCheckIntervalMs: 5000,
  // ... other config
});

await orchestrator.start();

// Get maintenance status
const status = await orchestrator.getMaintenanceStatus();
console.log('Mode:', status.mode);

// Request maintenance
await orchestrator.requestMaintenance();

// Enter maintenance (if ready)
await orchestrator.enterMaintenance();

// Exit maintenance
await orchestrator.exitMaintenance();

// Check if can accept tasks
const canAccept = await orchestrator.canAcceptTasks();
if (!canAccept) {
  console.log('In maintenance mode');
}
```

### Direct Database API

```typescript
import {
  createDatabase,
  runMigrations,
  getMigrationStatus,
  getMaintenanceStatus,
  requestMaintenance,
  enterMaintenance,
  exitMaintenance,
} from '@pipeweave/orchestrator';

const db = createDatabase({ connectionString: process.env.DATABASE_URL });

// Migrations
const status = await getMigrationStatus(db);
console.log('Pending migrations:', status.pending.length);

await runMigrations(db);

// Maintenance
const maint = await getMaintenanceStatus(db);
console.log('Mode:', maint.mode);

await requestMaintenance(db);
await enterMaintenance(db);
await exitMaintenance(db);
```

---

## Best Practices

### For Migrations

1. **Always run migrations through CLI in production**
   ```bash
   # ✅ Good
   pipeweave db:migrate

   # ❌ Bad
   AUTO_MIGRATE=true pipeweave-orchestrator
   ```

2. **Test migrations on a database dump**
   ```bash
   # Create test database from production dump
   pg_dump -h prod-host -d pipeweave | psql -h localhost -d pipeweave_test

   # Test migration
   DATABASE_URL=postgres://localhost/pipeweave_test pipeweave db:migrate
   ```

3. **Use maintenance mode for migrations**
   ```bash
   pipeweave maintenance:request
   # Wait for tasks to complete
   pipeweave db:migrate
   pipeweave maintenance:exit
   ```

4. **Validate before running**
   ```bash
   pipeweave db:validate
   pipeweave db:status
   pipeweave db:migrate
   ```

### For Maintenance Mode

1. **Always use maintenance mode for schema changes**
   ```bash
   pipeweave maintenance:request
   pipeweave db:migrate
   pipeweave maintenance:exit
   ```

2. **Monitor task completion**
   ```bash
   # In a loop
   while true; do
     pipeweave maintenance:status
     sleep 5
   done
   ```

3. **Set up alerts for long-running maintenance**
   ```typescript
   const status = await orchestrator.getMaintenanceStatus();

   if (status.mode === 'waiting_for_maintenance') {
     const elapsed = Date.now() - status.modeChangedAt.getTime();
     if (elapsed > 5 * 60 * 1000) { // 5 minutes
       // Alert: Tasks taking too long to complete
     }
   }
   ```

4. **Graceful shutdown with maintenance mode**
   ```typescript
   process.on('SIGTERM', async () => {
     console.log('Shutdown requested');

     // Request maintenance
     await orchestrator.requestMaintenance();

     // Wait for tasks to complete (with timeout)
     const timeout = 30000; // 30 seconds
     const start = Date.now();

     while (Date.now() - start < timeout) {
       const status = await orchestrator.getMaintenanceStatus();
       if (status.mode === 'maintenance') {
         break;
       }
       await new Promise(r => setTimeout(r, 1000));
     }

     await orchestrator.stop();
     process.exit(0);
   });
   ```

### Deployment Workflow

```bash
#!/bin/bash
# deploy.sh

set -e

echo "1. Request maintenance mode..."
pipeweave maintenance:request

echo "2. Waiting for tasks to complete..."
while true; do
  STATUS=$(pipeweave maintenance:status | grep "Mode:" | awk '{print $2}')
  if [ "$STATUS" == "maintenance" ]; then
    break
  fi
  echo "   Still waiting... ($STATUS)"
  sleep 5
done

echo "3. Running migrations..."
pipeweave db:migrate

echo "4. Deploying new code..."
# Your deployment steps here
kubectl rollout restart deployment/orchestrator

echo "5. Waiting for rollout..."
kubectl rollout status deployment/orchestrator

echo "6. Exiting maintenance mode..."
pipeweave maintenance:exit

echo "✅ Deployment complete!"
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AUTO_MIGRATE` | `false` | Auto-run migrations on startup |
| `MAINTENANCE_CHECK_INTERVAL_MS` | `5000` | How often to check for auto-transition (ms) |

---

## Troubleshooting

### Migration stuck in waiting_for_maintenance

**Problem:** Requested maintenance but tasks aren't completing.

**Solution:**
```bash
# Check what tasks are running
pipeweave maintenance:status

# Check database directly
psql $DATABASE_URL -c "SELECT id, task_id, status, started_at FROM task_runs WHERE status IN ('pending', 'running')"

# Cancel stuck tasks (if safe)
psql $DATABASE_URL -c "UPDATE task_runs SET status = 'cancelled' WHERE status = 'running' AND started_at < NOW() - INTERVAL '1 hour'"
```

### Migration checksum mismatch

**Problem:** Migration file was modified after being applied.

**Solution:**
```bash
# This is dangerous! Only do if you know what you're doing

# Option 1: Revert the file to original
git checkout HEAD -- src/db/migrations/001_initial_schema.sql

# Option 2: Reset database and reapply
pipeweave-db reset --yes
pipeweave db:migrate
```

### Can't exit maintenance mode

**Problem:** `pipeweave maintenance:exit` doesn't work.

**Solution:**
```bash
# Check current state
pipeweave maintenance:status

# Force exit via database
psql $DATABASE_URL -c "UPDATE orchestrator_state SET mode = 'running' WHERE id = 'singleton'"
```

---

## Examples

See [EXAMPLE_USAGE.md](./EXAMPLE_USAGE.md) for complete examples.
