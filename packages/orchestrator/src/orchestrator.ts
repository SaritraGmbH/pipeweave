import type { StorageBackendConfig } from '@pipeweave/shared';
import { createDatabase, testConnection, closeDatabase, type Database, type DatabaseConfig } from './db/index.js';
import { initializeSchema, isDatabaseInitialized } from './db/migrations.js';

// ============================================================================
// Types
// ============================================================================

export interface OrchestratorConfig {
  /** PostgreSQL connection URL */
  databaseUrl?: string;
  /** Database configuration (alternative to databaseUrl) */
  databaseConfig?: DatabaseConfig;
  /** Storage backend configurations (supports multiple) */
  storageBackends: StorageBackendConfig[];
  /** Default storage backend ID (optional, uses first if not specified) */
  defaultStorageBackendId?: string;
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
  /** Auto-initialize database schema on startup */
  autoInitDb?: boolean;
}

// ============================================================================
// Orchestrator Class
// ============================================================================

export class Orchestrator {
  private config: Required<Omit<OrchestratorConfig, 'defaultStorageBackendId' | 'databaseUrl' | 'databaseConfig'>> & {
    defaultStorageBackendId: string;
    databaseUrl?: string;
    databaseConfig?: DatabaseConfig;
  };
  private storageBackends: Map<string, StorageBackendConfig>;
  private defaultStorageBackend: StorageBackendConfig;
  private db: Database | null = null;

  constructor(config: OrchestratorConfig) {
    if (!config.databaseUrl && !config.databaseConfig) {
      throw new Error('Either databaseUrl or databaseConfig must be provided');
    }

    if (!config.storageBackends || config.storageBackends.length === 0) {
      throw new Error('At least one storage backend must be configured');
    }

    // Build storage backends map
    this.storageBackends = new Map();
    for (const backend of config.storageBackends) {
      if (this.storageBackends.has(backend.id)) {
        throw new Error(`Duplicate storage backend ID: ${backend.id}`);
      }
      this.storageBackends.set(backend.id, backend);
    }

    // Determine default storage backend
    let defaultBackendId = config.defaultStorageBackendId;
    if (!defaultBackendId) {
      // Use first backend marked as default, or just the first one
      const defaultBackend = config.storageBackends.find((b) => b.isDefault);
      defaultBackendId = defaultBackend?.id ?? config.storageBackends[0].id;
    }

    const defaultBackend = this.storageBackends.get(defaultBackendId);
    if (!defaultBackend) {
      throw new Error(`Default storage backend '${defaultBackendId}' not found`);
    }
    this.defaultStorageBackend = defaultBackend;

    this.config = {
      databaseUrl: config.databaseUrl,
      databaseConfig: config.databaseConfig,
      storageBackends: config.storageBackends,
      defaultStorageBackendId: defaultBackendId,
      secretKey: config.secretKey,
      mode: config.mode ?? 'standalone',
      maxConcurrency: config.maxConcurrency ?? 10,
      pollIntervalMs: config.pollIntervalMs ?? 1000,
      dlqRetentionDays: config.dlqRetentionDays ?? 30,
      idempotencyTTLSeconds: config.idempotencyTTLSeconds ?? 86400,
      maxRetryDelayMs: config.maxRetryDelayMs ?? 86400000,
      port: config.port ?? 3000,
      autoInitDb: config.autoInitDb ?? false,
    };
  }

  /**
   * Get a storage backend by ID
   */
  getStorageBackend(id?: string): StorageBackendConfig {
    if (!id) {
      return this.defaultStorageBackend;
    }

    const backend = this.storageBackends.get(id);
    if (!backend) {
      throw new Error(`Storage backend '${id}' not found`);
    }

    return backend;
  }

  /**
   * Get default storage backend
   */
  getDefaultStorageBackend(): StorageBackendConfig {
    return this.defaultStorageBackend;
  }

  /**
   * List all storage backend IDs
   */
  listStorageBackendIds(): string[] {
    return Array.from(this.storageBackends.keys());
  }

  /**
   * Get database instance (throws if not initialized)
   */
  getDatabase(): Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call start() first.');
    }
    return this.db;
  }

  async start(): Promise<void> {
    console.log(`[PipeWeave] Orchestrator starting in ${this.config.mode} mode...`);

    // Initialize database connection
    console.log('[PipeWeave] Connecting to database...');
    try {
      if (this.config.databaseUrl) {
        this.db = createDatabase({ connectionString: this.config.databaseUrl });
      } else if (this.config.databaseConfig) {
        this.db = createDatabase(this.config.databaseConfig);
      }

      // Test connection
      const connected = await testConnection(this.db!);
      if (!connected) {
        throw new Error('Database connection test failed');
      }
      console.log('[PipeWeave] Database connected successfully');

      // Check if database is initialized
      const initialized = await isDatabaseInitialized(this.db!);
      if (!initialized) {
        if (this.config.autoInitDb) {
          console.log('[PipeWeave] Database not initialized, initializing schema...');
          await initializeSchema(this.db!);
        } else {
          console.warn('[PipeWeave] WARNING: Database schema not initialized. Run migrations first.');
        }
      } else {
        console.log('[PipeWeave] Database schema initialized');
      }
    } catch (error) {
      console.error('[PipeWeave] Database initialization failed:', error);
      throw error;
    }

    // Display storage configuration
    console.log(`[PipeWeave] Configured storage backends:`);
    for (const backend of this.config.storageBackends) {
      const isDefault = backend.id === this.config.defaultStorageBackendId;
      console.log(`  • ${backend.id} (${backend.provider})${isDefault ? ' [default]' : ''}`);
      console.log(`    Endpoint: ${backend.endpoint}`);
      console.log(`    Bucket: ${backend.bucket}`);
    }

    // TODO: Implement remaining startup
    // - Initialize storage clients
    // - Start HTTP server
    // - Start polling loop (standalone mode)
    console.log(`[PipeWeave] Orchestrator listening on port ${this.config.port}`);
  }

  async stop(): Promise<void> {
    console.log('[PipeWeave] Orchestrator stopping...');

    // Close database connection
    if (this.db) {
      console.log('[PipeWeave] Closing database connection...');
      closeDatabase(this.db);
      this.db = null;
    }

    // TODO: Implement graceful shutdown
    // - Stop HTTP server
    // - Stop polling loop
    // - Close storage clients
    console.log('[PipeWeave] Orchestrator stopped');
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

  // Parse database configuration
  let databaseUrl: string | undefined;
  let databaseConfig: DatabaseConfig | undefined;

  if (process.env.DATABASE_URL) {
    // Primary method: connection string
    databaseUrl = process.env.DATABASE_URL;
  } else {
    // Alternative method: individual credentials
    const host = process.env.DB_HOST;
    const database = process.env.DB_NAME || process.env.DB_DATABASE;
    const user = process.env.DB_USER || process.env.DB_USERNAME;
    const password = process.env.DB_PASS || process.env.DB_PASSWORD;
    const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432;

    if (host && database && user) {
      // Determine SSL configuration
      let ssl: boolean | { rejectUnauthorized: boolean } | undefined;

      if (process.env.NODE_ENV === 'production') {
        // Production with Cloud SQL Unix socket - no SSL needed
        if (host.startsWith('/cloudsql/')) {
          ssl = undefined;
        } else {
          // Remote connection - use SSL with relaxed validation
          ssl = { rejectUnauthorized: false };
        }
      } else {
        // Local development - use SSL if explicitly enabled
        ssl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined;
      }

      databaseConfig = {
        host,
        port,
        database,
        user,
        password,
        ssl,
        max: optional('DB_POOL_MAX', 10, parseInt),
        allowExitOnIdle: optional('DB_ALLOW_EXIT_ON_IDLE', false, (v) => v === 'true'),
      };
    }
  }

  if (!databaseUrl && !databaseConfig) {
    throw new Error(
      'Missing database configuration: set DATABASE_URL or (DB_HOST, DB_NAME, DB_USER)'
    );
  }

  // Parse storage backends from STORAGE_BACKENDS JSON or legacy env vars
  let storageBackends: StorageBackendConfig[];

  if (process.env.STORAGE_BACKENDS) {
    // New multi-backend configuration
    try {
      storageBackends = JSON.parse(process.env.STORAGE_BACKENDS);
    } catch (error) {
      throw new Error('Invalid STORAGE_BACKENDS JSON: ' + error);
    }
  } else {
    // Legacy single-backend configuration (backward compatibility)
    const provider = optional('STORAGE_PROVIDER', 'aws-s3') as 'aws-s3' | 'gcs' | 'minio';

    let credentials: any;
    if (provider === 'aws-s3') {
      credentials = {
        accessKeyId: required('S3_ACCESS_KEY'),
        secretAccessKey: required('S3_SECRET_KEY'),
      };
    } else if (provider === 'gcs') {
      credentials = {
        projectId: required('GCS_PROJECT_ID'),
        clientEmail: required('GCS_CLIENT_EMAIL'),
        privateKey: required('GCS_PRIVATE_KEY'),
      };
    } else if (provider === 'minio') {
      credentials = {
        accessKey: required('MINIO_ACCESS_KEY'),
        secretKey: required('MINIO_SECRET_KEY'),
      };
    }

    storageBackends = [
      {
        id: 'default',
        provider,
        endpoint: required('S3_ENDPOINT'),
        bucket: required('S3_BUCKET'),
        region: process.env.S3_REGION,
        credentials,
        isDefault: true,
      },
    ];
  }

  return createOrchestrator({
    databaseUrl,
    databaseConfig,
    storageBackends,
    defaultStorageBackendId: process.env.DEFAULT_STORAGE_BACKEND_ID,
    secretKey: required('PIPEWEAVE_SECRET_KEY'),
    mode: optional('MODE', 'standalone') as 'standalone' | 'serverless',
    maxConcurrency: optional('MAX_CONCURRENCY', 10, parseInt),
    pollIntervalMs: optional('POLL_INTERVAL_MS', 1000, parseInt),
    dlqRetentionDays: optional('DLQ_RETENTION_DAYS', 30, parseInt),
    idempotencyTTLSeconds: optional('IDEMPOTENCY_TTL_SECONDS', 86400, parseInt),
    maxRetryDelayMs: optional('MAX_RETRY_DELAY_MS', 86400000, parseInt),
    port: optional('PORT', 3000, parseInt),
    autoInitDb: optional('AUTO_INIT_DB', false, (v) => v === 'true'),
  });
}