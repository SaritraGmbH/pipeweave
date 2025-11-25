import type { ENV } from '@pipeweave/shared';

// ============================================================================
// Types
// ============================================================================

export interface OrchestratorConfig {
  /** PostgreSQL connection URL */
  databaseUrl: string;
  /** S3/MinIO endpoint */
  s3Endpoint: string;
  /** S3 bucket name */
  s3Bucket: string;
  /** S3 access key */
  s3AccessKey: string;
  /** S3 secret key */
  s3SecretKey: string;
  /** Shared secret key for JWT encryption */
  secretKey: string;
  /** Execution mode */
  mode?: 'standalone' | 'serverless';
  /** Maximum concurrent task executions */
  maxConcurrency?: number;
  /** Polling interval in ms (standalone mode) */
  pollIntervalMs?: number;
  /** DLQ retention in days */
  dlqRetentionDays?: number;
  /** Default idempotency TTL in seconds */
  idempotencyTTLSeconds?: number;
  /** Default max retry delay in ms */
  maxRetryDelayMs?: number;
  /** Server port */
  port?: number;
}

// ============================================================================
// Orchestrator Class
// ============================================================================

export class Orchestrator {
  private config: Required<OrchestratorConfig>;

  constructor(config: OrchestratorConfig) {
    this.config = {
      databaseUrl: config.databaseUrl,
      s3Endpoint: config.s3Endpoint,
      s3Bucket: config.s3Bucket,
      s3AccessKey: config.s3AccessKey,
      s3SecretKey: config.s3SecretKey,
      secretKey: config.secretKey,
      mode: config.mode ?? 'standalone',
      maxConcurrency: config.maxConcurrency ?? 10,
      pollIntervalMs: config.pollIntervalMs ?? 1000,
      dlqRetentionDays: config.dlqRetentionDays ?? 30,
      idempotencyTTLSeconds: config.idempotencyTTLSeconds ?? 86400,
      maxRetryDelayMs: config.maxRetryDelayMs ?? 86400000,
      port: config.port ?? 3000,
    };
  }

  async start(): Promise<void> {
    console.log(`[PipeWeave] Orchestrator starting in ${this.config.mode} mode...`);
    // TODO: Implement startup
    // - Initialize database connection
    // - Initialize S3 client
    // - Start HTTP server
    // - Start polling loop (standalone mode)
    console.log(`[PipeWeave] Orchestrator listening on port ${this.config.port}`);
  }

  async stop(): Promise<void> {
    console.log('[PipeWeave] Orchestrator stopping...');
    // TODO: Implement graceful shutdown
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createOrchestrator(config: OrchestratorConfig): Orchestrator {
  return new Orchestrator(config);
}

// ============================================================================
// Environment Config Helper
// ============================================================================

export function createOrchestratorFromEnv(): Orchestrator {
  const required = (name: string): string => {
    const value = process.env[name];
    if (!value) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
  };

  const optional = <T>(name: string, defaultValue: T, parse?: (v: string) => T): T => {
    const value = process.env[name];
    if (!value) return defaultValue;
    return parse ? parse(value) : (value as unknown as T);
  };

  return createOrchestrator({
    databaseUrl: required('DATABASE_URL'),
    s3Endpoint: required('S3_ENDPOINT'),
    s3Bucket: required('S3_BUCKET'),
    s3AccessKey: required('S3_ACCESS_KEY'),
    s3SecretKey: required('S3_SECRET_KEY'),
    secretKey: required('PIPEWEAVE_SECRET_KEY'),
    mode: optional('MODE', 'standalone') as 'standalone' | 'serverless',
    maxConcurrency: optional('MAX_CONCURRENCY', 10, parseInt),
    pollIntervalMs: optional('POLL_INTERVAL_MS', 1000, parseInt),
    dlqRetentionDays: optional('DLQ_RETENTION_DAYS', 30, parseInt),
    idempotencyTTLSeconds: optional('IDEMPOTENCY_TTL_SECONDS', 86400, parseInt),
    maxRetryDelayMs: optional('MAX_RETRY_DELAY_MS', 86400000, parseInt),
    port: optional('PORT', 3000, parseInt),
  });
}