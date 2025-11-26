import { registerStorageProvider } from '@pipeweave/shared';
import { AWSS3Provider } from './aws-s3.js';
import { GCSProvider } from './gcs.js';
import { MinIOProvider } from './minio.js';
import { LocalProvider } from './local.js';

// Register all storage providers
registerStorageProvider('aws-s3', AWSS3Provider);
registerStorageProvider('gcs', GCSProvider);
registerStorageProvider('minio', MinIOProvider);
registerStorageProvider('local', LocalProvider);

// Re-export providers
export { AWSS3Provider, GCSProvider, MinIOProvider, LocalProvider };
export * from '@pipeweave/shared';
