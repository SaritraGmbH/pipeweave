// ============================================================================
// Storage Provider Types
// ============================================================================

/**
 * Supported storage providers
 */
export type StorageProvider = 'aws-s3' | 'gcs' | 'minio' | 'local';

/**
 * AWS S3 credentials
 */
export interface AWSS3Credentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
}

/**
 * Google Cloud Storage credentials
 */
export interface GCSCredentials {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

/**
 * MinIO credentials (S3-compatible)
 */
export interface MinIOCredentials {
  accessKey: string;
  secretKey: string;
}

/**
 * Local filesystem storage credentials
 */
export interface LocalCredentials {
  /** Base directory path for storing files */
  basePath: string;
}

/**
 * Union type for all credential types
 */
export type StorageCredentials =
  | { provider: 'aws-s3'; credentials: AWSS3Credentials }
  | { provider: 'gcs'; credentials: GCSCredentials }
  | { provider: 'minio'; credentials: MinIOCredentials }
  | { provider: 'local'; credentials: LocalCredentials };

/**
 * Storage backend configuration
 */
export interface StorageBackendConfig {
  /** Unique identifier for this backend */
  id: string;

  /** Storage provider type */
  provider: StorageProvider;

  /** Endpoint URL (e.g., https://s3.amazonaws.com, https://storage.googleapis.com) */
  endpoint: string;

  /** Bucket name */
  bucket: string;

  /** Region (for AWS S3 and some GCS configurations) */
  region?: string;

  /** Provider-specific credentials */
  credentials: AWSS3Credentials | GCSCredentials | MinIOCredentials | LocalCredentials;

  /** Whether this is the default backend */
  isDefault?: boolean;

  /** Optional description */
  description?: string;
}

/**
 * Storage backend credentials that get encrypted in JWT
 */
export interface StorageBackendCredentials {
  id: string;
  provider: StorageProvider;
  endpoint: string;
  bucket: string;
  region?: string;
  credentials: AWSS3Credentials | GCSCredentials | MinIOCredentials | LocalCredentials;
}
