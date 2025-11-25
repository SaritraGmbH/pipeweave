// ============================================================================
// Default Values
// ============================================================================

export const DEFAULTS = {
  /** Default task timeout in seconds */
  TASK_TIMEOUT: 300,
  /** Default max retry attempts */
  TASK_RETRIES: 3,
  /** Default base retry delay in ms */
  TASK_RETRY_DELAY_MS: 1000,
  /** Default max retry delay in ms (24 hours) */
  TASK_MAX_RETRY_DELAY_MS: 86400000,
  /** Default heartbeat interval in ms (1 minute) */
  TASK_HEARTBEAT_INTERVAL_MS: 60000,
  /** Default task priority */
  TASK_PRIORITY: 100,
  /** Default idempotency TTL in seconds (24 hours) */
  IDEMPOTENCY_TTL: 86400,
  /** Default DLQ retention in days */
  DLQ_RETENTION_DAYS: 30,
  /** Default orchestrator poll interval in ms */
  POLL_INTERVAL_MS: 1000,
  /** Default max concurrent tasks */
  MAX_CONCURRENCY: 10,
} as const;

// ============================================================================
// ID Prefixes
// ============================================================================

export const ID_PREFIX = {
  PIPELINE_RUN: 'prun_',
  TASK_RUN: 'trun_',
  DLQ_ITEM: 'dlq_',
  SERVICE: 'svc_',
} as const;

// ============================================================================
// S3 Paths
// ============================================================================

export const S3_PATHS = {
  PIPELINE_INPUT: (runId: string) => `pipelines/${runId}/input.json`,
  STANDALONE_INPUT: (runId: string) => `standalone/${runId}/input.json`,
  TASK_OUTPUT: (pipelineRunId: string, taskRunId: string) =>
    `runs/${pipelineRunId}/outputs/${taskRunId}.json`,
  TASK_ASSETS: (pipelineRunId: string, taskRunId: string) =>
    `runs/${pipelineRunId}/assets/${taskRunId}`,
  TASK_LOGS: (pipelineRunId: string, taskRunId: string) =>
    `runs/${pipelineRunId}/logs/${taskRunId}.jsonl`,
} as const;

// ============================================================================
// HTTP Headers
// ============================================================================

export const HEADERS = {
  STORAGE_TOKEN: 'x-pipeweave-storage-token',
  SERVICE_ID: 'x-pipeweave-service-id',
  RUN_ID: 'x-pipeweave-run-id',
} as const;

// ============================================================================
// Environment Variable Names
// ============================================================================

export const ENV = {
  DATABASE_URL: 'DATABASE_URL',
  S3_ENDPOINT: 'S3_ENDPOINT',
  S3_BUCKET: 'S3_BUCKET',
  S3_ACCESS_KEY: 'S3_ACCESS_KEY',
  S3_SECRET_KEY: 'S3_SECRET_KEY',
  SECRET_KEY: 'PIPEWEAVE_SECRET_KEY',
  MODE: 'MODE',
  MAX_CONCURRENCY: 'MAX_CONCURRENCY',
  POLL_INTERVAL_MS: 'POLL_INTERVAL_MS',
  DLQ_RETENTION_DAYS: 'DLQ_RETENTION_DAYS',
  IDEMPOTENCY_TTL_SECONDS: 'IDEMPOTENCY_TTL_SECONDS',
  MAX_RETRY_DELAY_MS: 'MAX_RETRY_DELAY_MS',
  ORCHESTRATOR_URL: 'PIPEWEAVE_ORCHESTRATOR_URL',
  API_TOKEN: 'PIPEWEAVE_API_TOKEN',
} as const;