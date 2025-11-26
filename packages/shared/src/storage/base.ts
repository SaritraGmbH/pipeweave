import type { StorageProvider, StorageBackendCredentials } from '../types/storage.js';

// ============================================================================
// Storage Provider Interface
// ============================================================================

/**
 * Abstract storage provider interface
 */
export interface IStorageProvider {
  /** Provider type */
  readonly provider: StorageProvider;

  /**
   * Download a file from storage
   * @param path - Object path in bucket
   * @returns File content as Buffer
   */
  download(path: string): Promise<Buffer>;

  /**
   * Upload a file to storage
   * @param path - Object path in bucket
   * @param content - File content
   * @param contentType - MIME type
   */
  upload(path: string, content: Buffer | string, contentType: string): Promise<void>;

  /**
   * Check if an object exists
   * @param path - Object path in bucket
   */
  exists(path: string): Promise<boolean>;

  /**
   * Delete an object
   * @param path - Object path in bucket
   */
  delete(path: string): Promise<void>;

  /**
   * List objects with a prefix
   * @param prefix - Object path prefix
   * @param maxKeys - Maximum number of keys to return
   */
  list(prefix: string, maxKeys?: number): Promise<string[]>;
}

/**
 * Base storage provider class
 */
export abstract class BaseStorageProvider implements IStorageProvider {
  protected credentials: StorageBackendCredentials;

  constructor(credentials: StorageBackendCredentials) {
    this.credentials = credentials;
  }

  abstract get provider(): StorageProvider;
  abstract download(path: string): Promise<Buffer>;
  abstract upload(path: string, content: Buffer | string, contentType: string): Promise<void>;
  abstract exists(path: string): Promise<boolean>;
  abstract delete(path: string): Promise<void>;
  abstract list(prefix: string, maxKeys?: number): Promise<string[]>;

  /**
   * Get full object URL
   */
  protected getObjectUrl(path: string): string {
    const endpoint = this.credentials.endpoint.replace(/\/$/, '');
    const bucket = this.credentials.bucket;
    return `${endpoint}/${bucket}/${path}`;
  }

  /**
   * Convert string or Buffer to Buffer
   */
  protected toBuffer(content: Buffer | string): Buffer {
    return Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf-8');
  }
}
