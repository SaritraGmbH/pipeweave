import pgPromise from 'pg-promise';
import type { IDatabase, IMain } from 'pg-promise';

// ============================================================================
// Types
// ============================================================================

export interface DatabaseConfig {
  /** PostgreSQL connection string (e.g., postgres://user:pass@host:port/db) */
  connectionString?: string;
  /** Individual connection parameters (alternative to connectionString) */
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  /** SSL configuration */
  ssl?: boolean | { rejectUnauthorized: boolean };
  /** Maximum number of connections in the pool */
  max?: number;
  /** Allow the pool to exit on idle (useful for serverless) */
  allowExitOnIdle?: boolean;
}

export type Database = IDatabase<any>;

// ============================================================================
// pg-promise Instance
// ============================================================================

let pgp: IMain | null = null;

/**
 * Initialize pg-promise with custom configuration
 */
export function initializePgPromise(options?: {
  capSQL?: boolean;
  onError?: (err: Error, e: any) => void;
}): IMain {
  if (pgp) {
    return pgp;
  }

  pgp = pgPromise({
    capSQL: options?.capSQL ?? true, // capitalize all generated SQL
    error: (err, e) => {
      // Default error handler - can be customized via options
      console.error('[db] Error:', err.message, e.query);
      if (options?.onError) {
        options.onError(err, e);
      }
    },
  });

  // Bug fix for incorrect dates across timezones
  // https://github.com/vitaly-t/pg-promise/issues/130
  pgp.pg.types.setTypeParser(1114, (stringValue: string) => {
    return stringValue;
  });

  return pgp;
}

// ============================================================================
// Database Connection Factory
// ============================================================================

/**
 * Create a database connection instance
 * Supports both connectionString and individual credentials
 */
export function createDatabase(config: DatabaseConfig): Database {
  if (!pgp) {
    initializePgPromise();
  }

  // Build connection configuration
  const connectionConfig: any = {
    max: config.max ?? 10,
    allowExitOnIdle: config.allowExitOnIdle ?? false,
  };

  // Primary method: connectionString
  if (config.connectionString) {
    connectionConfig.connectionString = config.connectionString;

    // Add SSL if specified
    if (config.ssl !== undefined) {
      connectionConfig.ssl = config.ssl;
    }
  }
  // Alternative method: individual credentials
  else if (config.host && config.database && config.user) {
    connectionConfig.host = config.host;
    connectionConfig.port = config.port ?? 5432;
    connectionConfig.database = config.database;
    connectionConfig.user = config.user;
    connectionConfig.password = config.password;

    // Add SSL if specified
    if (config.ssl !== undefined) {
      connectionConfig.ssl = config.ssl;
    }
  } else {
    throw new Error(
      'Invalid database configuration: must provide either connectionString or (host, database, user)'
    );
  }

  const db = pgp!(connectionConfig);
  return db;
}

/**
 * Parse DATABASE_URL from environment and create database connection
 */
export function createDatabaseFromEnv(): Database {
  const connectionString = process.env.DATABASE_URL;

  if (connectionString) {
    // Use connection string if available
    return createDatabase({
      connectionString,
      ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : undefined,
      max: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX) : 10,
      allowExitOnIdle: process.env.DB_ALLOW_EXIT_ON_IDLE === 'true',
    });
  } else {
    // Fall back to individual environment variables
    const host = process.env.DB_HOST;
    const database = process.env.DB_NAME || process.env.DB_DATABASE;
    const user = process.env.DB_USER || process.env.DB_USERNAME;
    const password = process.env.DB_PASS || process.env.DB_PASSWORD;
    const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432;

    if (!host || !database || !user) {
      throw new Error(
        'Missing database configuration: set DATABASE_URL or (DB_HOST, DB_NAME, DB_USER)'
      );
    }

    // Determine SSL configuration based on environment
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

    return createDatabase({
      host,
      port,
      database,
      user,
      password,
      ssl,
      max: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX) : 10,
      allowExitOnIdle: process.env.DB_ALLOW_EXIT_ON_IDLE === 'true',
    });
  }
}

/**
 * Test database connection
 */
export async function testConnection(db: Database): Promise<boolean> {
  try {
    await db.one('SELECT 1 as test');
    return true;
  } catch (error) {
    console.error('[db] Connection test failed:', error);
    return false;
  }
}

/**
 * Close database connection
 */
export function closeDatabase(db: Database): void {
  if (pgp) {
    pgp.$pool.end();
  }
}
