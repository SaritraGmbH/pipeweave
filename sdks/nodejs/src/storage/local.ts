import { promises as fs } from 'fs';
import * as path from 'path';
import { BaseStorageProvider, type IStorageProvider } from '@pipeweave/shared';
import type { StorageBackendCredentials, LocalCredentials } from '@pipeweave/shared';

/**
 * Local filesystem storage provider
 */
export class LocalProvider extends BaseStorageProvider implements IStorageProvider {
  private basePath: string;

  constructor(credentials: StorageBackendCredentials) {
    super(credentials);

    if (credentials.provider !== 'local') {
      throw new Error(`Invalid provider for LocalProvider: ${credentials.provider}`);
    }

    const localCredentials = credentials.credentials as LocalCredentials;
    this.basePath = localCredentials.basePath;
  }

  get provider() {
    return 'local' as const;
  }

  /**
   * Get full file path
   */
  private getFilePath(objectPath: string): string {
    // Remove leading slash if present
    const normalizedPath = objectPath.startsWith('/') ? objectPath.slice(1) : objectPath;
    return path.join(this.basePath, normalizedPath);
  }

  /**
   * Ensure directory exists
   */
  private async ensureDirectory(filePath: string): Promise<void> {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
  }

  async download(objectPath: string): Promise<Buffer> {
    const filePath = this.getFilePath(objectPath);

    try {
      return await fs.readFile(filePath);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error(`File not found: ${objectPath}`);
      }
      throw new Error(`Failed to download from local storage: ${error.message}`);
    }
  }

  async upload(objectPath: string, content: Buffer | string, contentType: string): Promise<void> {
    const filePath = this.getFilePath(objectPath);
    const buffer = this.toBuffer(content);

    try {
      await this.ensureDirectory(filePath);
      await fs.writeFile(filePath, buffer);
    } catch (error: any) {
      throw new Error(`Failed to upload to local storage: ${error.message}`);
    }
  }

  async exists(objectPath: string): Promise<boolean> {
    const filePath = this.getFilePath(objectPath);

    try {
      await fs.access(filePath);
      return true;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return false;
      }
      throw new Error(`Failed to check local file existence: ${error.message}`);
    }
  }

  async delete(objectPath: string): Promise<void> {
    const filePath = this.getFilePath(objectPath);

    try {
      await fs.unlink(filePath);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, consider it deleted
        return;
      }
      throw new Error(`Failed to delete from local storage: ${error.message}`);
    }
  }

  async list(prefix: string, maxKeys: number = 1000): Promise<string[]> {
    const prefixPath = this.getFilePath(prefix);
    const results: string[] = [];

    try {
      // Check if prefix path exists
      try {
        await fs.access(prefixPath);
      } catch {
        // Prefix doesn't exist, return empty array
        return [];
      }

      // Get stats to check if it's a directory or file
      const stats = await fs.stat(prefixPath);

      if (stats.isFile()) {
        // If prefix is a file, return it
        return [prefix];
      }

      // Recursively list all files under prefix
      await this.listRecursive(prefixPath, prefix, results, maxKeys);

      return results.slice(0, maxKeys);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw new Error(`Failed to list local files: ${error.message}`);
    }
  }

  /**
   * Recursively list files in directory
   */
  private async listRecursive(
    dirPath: string,
    prefix: string,
    results: string[],
    maxKeys: number
  ): Promise<void> {
    if (results.length >= maxKeys) {
      return;
    }

    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (results.length >= maxKeys) {
        break;
      }

      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(this.basePath, fullPath);

      if (entry.isDirectory()) {
        await this.listRecursive(fullPath, prefix, results, maxKeys);
      } else if (entry.isFile()) {
        results.push(relativePath);
      }
    }
  }
}
