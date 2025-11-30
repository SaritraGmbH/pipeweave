# @pipeweave/orchestrator

The PipeWeave orchestrator — the core execution engine that manages pipelines, queues tasks, and coordinates workers.

## Features

- **Pipeline execution** — Orchestrate complex DAG workflows
- **Task queue management** — Priority-based task scheduling
- **Worker registration** — Auto-discovery and health monitoring
- **Heartbeat monitoring** — Detect and recover from stalled tasks
- **Retry handling** — Automatic retries with configurable backoff
- **Idempotency** — Prevent duplicate task executions
- **Dead Letter Queue** — Capture and retry failed tasks
- **Code versioning** — Track task code changes across deployments
- **Multi-mode deployment** — Standalone or serverless execution

## Installation

```bash
npm install @pipeweave/orchestrator
```

## Quick Start

### Standalone Mode

```typescript
import { createOrchestrator } from "@pipeweave/orchestrator";

const orchestrator = createOrchestrator({
  databaseUrl: process.env.DATABASE_URL,
  storageBackends: [
    {
      id: "local-dev",
      provider: "local",
      endpoint: "file://",
      bucket: "data",
      credentials: {
        basePath: "./storage",
      },
      isDefault: true,
    },
    {
      id: "primary-s3",
      provider: "aws-s3",
      endpoint: "https://s3.amazonaws.com",
      bucket: "pipeweave-prod",
      region: "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    },
    {
      id: "gcs-backup",
      provider: "gcs",
      endpoint: "https://storage.googleapis.com",
      bucket: "pipeweave-backup",
      credentials: {
        projectId: "my-project",
        clientEmail: "service-account@...",
        privateKey: "-----BEGIN PRIVATE KEY-----\n...",
      },
    },
    {
      id: "local-minio",
      provider: "minio",
      endpoint: "http://localhost:9000",
      bucket: "pipeweave-dev",
      credentials: {
        accessKey: "minioadmin",
        secretKey: "minioadmin",
      },
    },
  ],
  secretKey: process.env.PIPEWEAVE_SECRET_KEY,
  mode: "standalone",
  maxConcurrency: 10,
  pollIntervalMs: 1000,
  logLevel: "normal", // Options: 'minimal' | 'normal' | 'detailed'
});

await orchestrator.start();
```

### Serverless Mode

```typescript
const orchestrator = createOrchestrator({
  // ... same config ...
  mode: "serverless",
});

await orchestrator.start();

// The /api/tick endpoint is built-in and called by external schedulers
// Example: Cloud Scheduler, cron job, etc. calls:
// POST http://your-orchestrator/api/tick
```

## Configuration

### Log Levels

The orchestrator supports three logging levels to control verbosity:

- **`minimal`** — Only critical events (startup, shutdown, errors, maintenance transitions)
- **`normal`** (default) — Important events including tick completions with task counts, database connections, backend summaries
- **`detailed`** — All events including HTTP requests, maintenance checker activity, detailed storage backend info

Example:
```typescript
const orchestrator = createOrchestrator({
  // ... other config ...
  logLevel: "detailed", // Show all logs
});
```

### Tick Logging

When the `/api/tick` endpoint is called (serverless mode), the orchestrator logs:
- **Detailed mode**: Tick start and completion with task count and duration
- **Normal mode**: Tick completion with task count and duration
- **Minimal mode**: Only errors and maintenance mode skips

Example log output:
```
[orchestrator] Tick completed - processed: 15 tasks in 234ms
```

## Environment Variables

| Variable                     | Required | Default      | Description                                   |
| ---------------------------- | -------- | ------------ | --------------------------------------------- |
| `DATABASE_URL`               | Yes      | —            | PostgreSQL connection string                  |
| `STORAGE_BACKENDS`           | Yes      | —            | JSON array of storage backend configurations  |
| `DEFAULT_STORAGE_BACKEND_ID` | No       | —            | Default storage backend ID                    |
| `PIPEWEAVE_SECRET_KEY`       | Yes      | —            | Shared JWT encryption key                     |
| `MODE`                       | No       | `standalone` | Execution mode (`standalone` or `serverless`) |
| `MAX_CONCURRENCY`            | No       | `10`         | Maximum parallel tasks                        |
| `POLL_INTERVAL_MS`           | No       | `1000`       | Task polling interval (standalone mode)       |
| `DLQ_RETENTION_DAYS`         | No       | `30`         | How long to keep DLQ entries                  |
| `IDEMPOTENCY_TTL_SECONDS`    | No       | `86400`      | Default idempotency cache TTL                 |
| `MAX_RETRY_DELAY_MS`         | No       | `86400000`   | Default max retry delay (24h)                 |
| `LOG_LEVEL`                  | No       | `normal`     | Logging verbosity (`minimal`, `normal`, `detailed`) |

## Folder Structure

```
packages/orchestrator/src/
├── index.ts                      # Public API exports
├── orchestrator.ts               # Main Orchestrator class
├── maintenance.ts                # Maintenance mode logic
│
├── bin/
│   └── server.ts                 # CLI entrypoint for standalone server
│
├── db/
│   └── index.ts                  # Database connection & client
│
├── routes/
│   ├── index.ts                  # Route registration
│   ├── health.ts                 # GET /health
│   ├── services.ts               # Service registration & listing
│   ├── pipelines.ts              # Pipeline management
│   ├── queue.ts                  # Task queue operations + /api/tick
│   ├── tasks.ts                  # Task execution (heartbeat, callback)
│   ├── dlq.ts                    # Dead Letter Queue
│   ├── storage.ts                # Storage proxy & backend listing
│   └── runs.ts                   # Pipeline & task run queries
│
├── core/
│   ├── registry.ts               # Service & task registry
│   ├── queue-manager.ts          # Task queue & scheduling
│   ├── executor.ts               # Task dispatcher
│   ├── poller.ts                 # Polling loop (standalone mode)
│   ├── heartbeat-monitor.ts      # Heartbeat tracking
│   ├── retry-manager.ts          # Retry logic & backoff
│   ├── idempotency.ts            # Idempotency key handling
│   └── dlq-manager.ts            # Dead Letter Queue operations
│
├── pipeline/
│   ├── validator.ts              # DAG validation & dry-run
│   ├── graph.ts                  # Pipeline graph analysis
│   └── executor.ts               # Pipeline execution logic
│
├── storage/
│   ├── client.ts                 # Storage client wrapper
│   └── jwt.ts                    # JWT encryption/decryption
│
└── types/
    └── internal.ts               # Internal-only types
```

## API Endpoints

### Health & Info

- `GET /health` — Health check + maintenance status
- `GET /api/info` — Orchestrator info (version, mode, uptime)

### Service Management

- `POST /api/services` — Worker registration
- `GET /api/services` — List registered services
- `GET /api/services/:id` — Get service details
- `GET /api/services/:id/tasks` — List tasks for a service

### Pipeline Management

- `GET /api/pipelines` — List all pipelines
- `GET /api/pipelines/:id` — Get pipeline details
- `POST /api/pipelines/:id/trigger` — Trigger a pipeline
- `POST /api/pipelines/:id/dry-run` — Validate pipeline without executing

### Task Queue

- `POST /api/queue/task` — Queue a standalone task
- `POST /api/queue/batch` — Queue multiple tasks
- `GET /api/queue/status` — Get queue statistics
- `GET /api/queue/items` — List queue items (with filters)
- `POST /api/tick` — **Process pending tasks (serverless mode trigger)**

### Task Execution

- `POST /api/task-runs/:runId/heartbeat` — Worker heartbeat and progress update
- `POST /api/task-runs/:runId/complete` — Task completion callback
- `GET /api/task-runs/:id` — Get task run details
- `GET /api/tasks/:id/history` — Task code change history
- `GET /api/tasks/:id/input-schema` — Get input schema for a task
- `POST /api/tasks/:id/validate-input` — Validate input against task schema

### Run Queries

- `GET /api/runs` — List pipeline runs (paginated, filtered)
- `GET /api/runs/:id` — Get pipeline run details
- `GET /api/task-runs/:id` — Get task run details

### Dead Letter Queue

- `GET /api/dlq` — List DLQ items (paginated, filtered)
- `GET /api/dlq/:id` — Get DLQ item details
- `POST /api/dlq/:id/retry` — Retry a DLQ item
- `POST /api/dlq/purge` — Purge old entries

### Storage

- `GET /api/storage/backends` — **List configured storage backends**
- `GET /api/storage/*` — Retrieve S3 content via orchestrator proxy

### Statistics

- `GET /api/statistics/system` — **Get system-wide statistics**
- `GET /api/statistics/services/:serviceId` — **Get service-level statistics**
- `GET /api/statistics/tasks/:taskId` — **Get task-level statistics**
- `GET /api/statistics/pipelines/:pipelineId` — **Get pipeline-level statistics**
- `GET /api/statistics/queue` — **Get real-time queue statistics**

## Architecture

### Multi-Storage Backend Support

The orchestrator supports multiple storage backends (Local filesystem, AWS S3, Google Cloud Storage, MinIO) simultaneously. Each backend is configured with provider-specific credentials and workers automatically use the appropriate SDK based on the provider type.

**Supported Providers:**
- **Local** — Local filesystem storage (ideal for development)
- **AWS S3** — Amazon's object storage service
- **Google Cloud Storage (GCS)** — Google's object storage
- **MinIO** — Self-hosted S3-compatible storage

### Worker-Side Hydration

The orchestrator generates JWT tokens containing encrypted storage backend credentials. Workers decrypt these tokens, instantiate the appropriate storage provider, and load data directly from storage, minimizing data transfer through the orchestrator.

```
Orchestrator                     Worker
     |                              |
     |--- JWT + metadata ---------->|
     |   (backend credentials)      |
     |                         Decrypt JWT
     |                              |
     |                    Create Storage Provider
     |                    (S3/GCS/MinIO)
     |                              |
     |                      Load from Storage
     |                              |
     |                         Execute task
     |                              |
     |<--- Callback (metadata) -----|
```

### Heartbeat Monitoring

Workers send periodic heartbeats while executing tasks. The orchestrator automatically detects stalled tasks and marks them for retry.

- Each task configures its own `heartbeatIntervalMs`
- Orchestrator calculates timeout as `2 × heartbeatIntervalMs`
- Missing heartbeat triggers task failure and retry
- Callback cancels pending timeout to prevent race conditions

### Code Versioning

The orchestrator tracks task code changes via SHA-256 hashing:

- Workers send code hashes on registration
- Orchestrator detects changes and increments `code_version`
- History stored in `task_code_history` table
- UI shows which tasks changed between runs

### Deployment Modes

**Standalone Mode:**

- Orchestrator runs a background poller
- Continuously processes pending tasks
- Suitable for dedicated servers, VMs, containers

**Serverless Mode:**

- No background polling
- External scheduler (Cloud Scheduler, cron) triggers `POST /api/tick`
- Suitable for Cloud Run, Lambda, serverless platforms

## Database Schema

The orchestrator uses PostgreSQL with tables for:

- `services` — Registered workers
- `tasks` — Task definitions with code hashes and versions
- `task_code_history` — Code change audit log
- `pipelines` — Pipeline definitions
- `pipeline_runs` — Pipeline execution tracking
- `task_runs` — Individual task executions
- `dlq` — Dead letter queue entries

Initialize the database with:

```bash
npx pipeweave db init --url $DATABASE_URL
```

## Monitoring

### Queue Statistics

```bash
curl http://localhost:3000/api/queue/status
```

```json
{
  "pending": 15,
  "running": 3,
  "waiting": 0,
  "completed": 142,
  "failed": 2,
  "dlq": 5,
  "oldestPending": "2024-01-15T10:30:00Z"
}
```

### System Statistics

Get comprehensive statistics with percentiles (p50, p95, p99) for runtime and wait times:

```bash
curl "http://localhost:3000/api/statistics/system?from=2024-01-15T00:00:00Z&to=2024-01-15T01:00:00Z&bucket=1m"
```

```json
{
  "buckets": [
    {
      "timestamp": "2024-01-15T00:00:00Z",
      "taskRuns": {
        "count": 150,
        "byStatus": {
          "completed": 145,
          "failed": 3,
          "timeout": 2,
          "cancelled": 0,
          "pending": 0,
          "running": 0
        },
        "runtime": {
          "count": 145,
          "min": 120,
          "max": 4500,
          "avg": 1250,
          "median": 1100,
          "p50": 1100,
          "p95": 3200,
          "p99": 4200
        },
        "waitTime": {
          "count": 145,
          "min": 50,
          "max": 2000,
          "avg": 500,
          "median": 450,
          "p50": 450,
          "p95": 1200,
          "p99": 1800
        },
        "retries": {
          "total": 5,
          "successful": 3
        }
      },
      "pipelineRuns": {
        "count": 20,
        "byStatus": {
          "completed": 18,
          "failed": 2,
          "cancelled": 0,
          "partial": 0
        },
        "runtime": {
          "count": 18,
          "min": 5000,
          "max": 45000,
          "avg": 15000,
          "median": 12000,
          "p50": 12000,
          "p95": 35000,
          "p99": 42000
        }
      },
      "queue": {
        "pending": 12,
        "running": 5,
        "waiting": 0
      },
      "errors": {
        "total": 5,
        "byCode": {
          "TIMEOUT": 2,
          "VALIDATION_ERROR": 3
        }
      },
      "dlq": {
        "added": 2,
        "retried": 0
      }
    }
  ],
  "summary": {
    "totalTaskRuns": 150,
    "totalPipelineRuns": 20,
    "avgSuccessRate": 0.967,
    "avgRuntime": 1250,
    "avgWaitTime": 500
  }
}
```

See [STATISTICS.md](./STATISTICS.md) for detailed documentation on the statistics system.

### Dead Letter Queue

```bash
curl http://localhost:3000/api/dlq
```

Failed tasks after all retries are preserved with:

- Original input and context
- All attempt errors
- Code version at failure time

## Security

### JWT Encryption

The orchestrator encrypts S3 credentials using AES-256-GCM:

1. Generate a 32-byte shared secret:

   ```bash
   openssl rand -hex 32
   ```

2. Set on both orchestrator and all workers:

   ```bash
   export PIPEWEAVE_SECRET_KEY="your-32-byte-hex-key"
   ```

3. Workers decrypt JWT to access S3 directly

### Access Control

- Service registration requires the shared secret key
- API endpoints can be secured with additional authentication
- S3 credentials are never exposed in API responses

## Examples

### Trigger a Pipeline

```bash
curl -X POST http://localhost:3000/api/pipelines/pdf-processor/trigger \
  -H "Content-Type: application/json" \
  -d '{"pdfUrl": "https://example.com/doc.pdf", "extractTables": true}'
```

### Queue a Standalone Task

```bash
curl -X POST http://localhost:3000/api/queue/task \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "process-document",
    "input": {"documentUrl": "https://..."},
    "priority": 50
  }'
```

### View Task Code History

```bash
curl http://localhost:3000/api/tasks/download/history
```

## Documentation

For complete documentation, see the [main specification](../../SPEC.md).

## License

MIT
