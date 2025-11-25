import { mkdir, writeFile, readFile, rm, copyFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { AssetType, AssetMetadata } from '@pipeweave/shared';
import type { StorageCredentials } from './crypto.js';

// ============================================================================
// Types
// ============================================================================

export interface HydrationManagerOptions {
  credentials: StorageCredentials;
  tempDir: string;
  runId: string;
  cleanupOnFailure: boolean;
}

interface UpstreamRef {
  outputPath: string;
  assets?: Record<string, AssetMetadata>;
}

// ============================================================================
// Hydration Manager
// ============================================================================

export class HydrationManager {
  private credentials: StorageCredentials;
  private tempDir: string;
  private runId: string;
  private cleanupOnFailure: boolean;
  
  private localAssets: Map<string, { type: AssetType; localPath: string }> = new Map();
  private upstreamAssets: Map<string, { type: AssetType; s3Path: string; localPath?: string }> = new Map();
  private logs: unknown[] = [];

  constructor(options: HydrationManagerOptions) {
    this.credentials = options.credentials;
    this.tempDir = join(options.tempDir, options.runId);
    this.runId = options.runId;
    this.cleanupOnFailure = options.cleanupOnFailure;
  }

  /**
   * Load input from S3
   */
  async loadInput(inputPath: string): Promise<unknown> {
    await this.ensureTempDir();
    const content = await this.downloadFromS3(inputPath);
    return JSON.parse(content);
  }

  /**
   * Load upstream outputs and register their assets
   */
  async loadUpstream(upstreamRefs: Record<string, UpstreamRef>): Promise<Record<string, unknown>> {
    const upstream: Record<string, unknown> = {};

    for (const [taskId, ref] of Object.entries(upstreamRefs)) {
      const content = await this.downloadFromS3(ref.outputPath);
      upstream[taskId] = JSON.parse(content);

      // Register upstream assets for lazy loading
      if (ref.assets) {
        for (const [key, metadata] of Object.entries(ref.assets)) {
          this.upstreamAssets.set(key, {
            type: metadata.type,
            s3Path: metadata.path,
          });
        }
      }
    }

    return upstream;
  }

  /**
   * Add an asset from data
   */
  async addAsset(key: string, type: AssetType, data: unknown): Promise<string> {
    await this.ensureTempDir();
    
    const localPath = join(this.tempDir, 'assets', key);
    await mkdir(join(this.tempDir, 'assets'), { recursive: true });

    let content: Buffer;
    if (type === 'json') {
      content = Buffer.from(JSON.stringify(data, null, 2), 'utf-8');
    } else if (type === 'text') {
      content = Buffer.from(String(data), 'utf-8');
    } else {
      content = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer);
    }

    await writeFile(localPath, content);
    this.localAssets.set(key, { type, localPath });

    return localPath;
  }

  /**
   * Add an asset from a file path
   */
  async addAssetFromPath(key: string, type: AssetType, filePath: string): Promise<string> {
    await this.ensureTempDir();
    
    const localPath = join(this.tempDir, 'assets', key);
    await mkdir(join(this.tempDir, 'assets'), { recursive: true });
    
    await copyFile(filePath, localPath);
    this.localAssets.set(key, { type, localPath });

    return localPath;
  }

  /**
   * Get an upstream asset (downloads if needed)
   */
  async getAsset(key: string): Promise<unknown> {
    // Check local assets first
    const local = this.localAssets.get(key);
    if (local) {
      const content = await readFile(local.localPath);
      if (local.type === 'json') {
        return JSON.parse(content.toString('utf-8'));
      } else if (local.type === 'text') {
        return content.toString('utf-8');
      } else {
        return content;
      }
    }

    // Check upstream assets
    const upstream = this.upstreamAssets.get(key);
    if (!upstream) {
      throw new Error(`Asset '${key}' not found`);
    }

    // Download and cache locally
    const localPath = await this.getAssetPath(key);
    const content = await readFile(localPath);

    if (upstream.type === 'json') {
      return JSON.parse(content.toString('utf-8'));
    } else if (upstream.type === 'text') {
      return content.toString('utf-8');
    } else {
      return content;
    }
  }

  /**
   * Get local path for an upstream asset (downloads if needed)
   */
  async getAssetPath(key: string): Promise<string> {
    // Check local assets first
    const local = this.localAssets.get(key);
    if (local) {
      return local.localPath;
    }

    // Check upstream assets
    const upstream = this.upstreamAssets.get(key);
    if (!upstream) {
      throw new Error(`Asset '${key}' not found`);
    }

    // Return cached path if already downloaded
    if (upstream.localPath) {
      return upstream.localPath;
    }

    // Download to temp dir
    await this.ensureTempDir();
    const localPath = join(this.tempDir, 'upstream-assets', key);
    await mkdir(join(this.tempDir, 'upstream-assets'), { recursive: true });

    const content = await this.downloadFromS3(upstream.s3Path);
    await writeFile(localPath, content);
    
    upstream.localPath = localPath;
    return localPath;
  }

  /**
   * Append a log entry
   */
  appendLog(entry: unknown): void {
    this.logs.push(entry);
  }

  /**
   * Dehydrate: upload output and assets to S3
   */
  async dehydrate(output: unknown): Promise<{
    outputPath: string;
    outputSize: number;
    assets: Record<string, AssetMetadata>;
    logsPath: string;
  }> {
    const basePath = `runs/${this.runId}`;
    
    // Upload output
    const outputContent = JSON.stringify(output, null, 2);
    const outputPath = `${basePath}/output.json`;
    await this.uploadToS3(outputPath, outputContent, 'application/json');

    // Upload assets
    const assets: Record<string, AssetMetadata> = {};
    for (const [key, asset] of this.localAssets) {
      const content = await readFile(asset.localPath);
      const assetPath = `${basePath}/assets/${key}`;
      const contentType = this.getContentType(asset.type);
      
      await this.uploadToS3(assetPath, content, contentType);
      
      assets[key] = {
        path: assetPath,
        size: content.length,
        type: asset.type,
      };
    }

    // Upload logs
    const logsContent = this.logs.map((l) => JSON.stringify(l)).join('\n');
    const logsPath = `${basePath}/logs.jsonl`;
    await this.uploadToS3(logsPath, logsContent, 'application/x-ndjson');

    // Cleanup temp directory
    await this.cleanup();

    return {
      outputPath,
      outputSize: outputContent.length,
      assets,
      logsPath,
    };
  }

  /**
   * Cleanup temp directory
   */
  async cleanup(): Promise<void> {
    if (existsSync(this.tempDir)) {
      await rm(this.tempDir, { recursive: true, force: true });
    }
  }

  private async ensureTempDir(): Promise<void> {
    await mkdir(this.tempDir, { recursive: true });
  }

  private getContentType(type: AssetType): string {
    switch (type) {
      case 'json':
        return 'application/json';
      case 'text':
        return 'text/plain';
      case 'binary':
      default:
        return 'application/octet-stream';
    }
  }

  // ============================================================================
  // S3 Operations (using fetch for simplicity - consider using @aws-sdk/client-s3)
  // ============================================================================

  private async downloadFromS3(path: string): Promise<string> {
    const url = `${this.credentials.endpoint}/${this.credentials.bucket}/${path}`;
    
    const response = await fetch(url, {
      headers: this.getAuthHeaders('GET', path),
    });

    if (!response.ok) {
      throw new Error(`Failed to download from S3: ${response.status} ${response.statusText}`);
    }

    return response.text();
  }

  private async uploadToS3(path: string, content: string | Buffer, contentType: string): Promise<void> {
    const url = `${this.credentials.endpoint}/${this.credentials.bucket}/${path}`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        ...this.getAuthHeaders('PUT', path),
        'Content-Type': contentType,
      },
      body: content,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload to S3: ${response.status} ${response.statusText}`);
    }
  }

  private getAuthHeaders(method: string, path: string): Record<string, string> {
    // Simplified auth headers - in production, use proper AWS Signature V4
    // This is a placeholder that works with MinIO's legacy auth
    return {
      'Authorization': `AWS ${this.credentials.accessKey}:${this.credentials.secretKey}`,
    };
  }
}