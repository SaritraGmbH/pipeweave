import { mkdir, writeFile, readFile, rm, copyFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { AssetType, AssetMetadata, StorageBackendCredentials, IStorageProvider } from '@pipeweave/shared';
import { createStorageProvider } from '@pipeweave/shared';
import './storage/index.js'; // Register all storage providers

// ============================================================================
// Types
// ============================================================================

export interface HydrationManagerOptions {
  credentials: StorageBackendCredentials;
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
  private storageProvider: IStorageProvider;
  private tempDir: string;
  private runId: string;
  private cleanupOnFailure: boolean;

  private localAssets: Map<string, { type: AssetType; localPath: string }> = new Map();
  private upstreamAssets: Map<string, { type: AssetType; storagePath: string; localPath?: string }> = new Map();
  private logs: unknown[] = [];

  constructor(options: HydrationManagerOptions) {
    this.storageProvider = createStorageProvider(options.credentials);
    this.tempDir = join(options.tempDir, options.runId);
    this.runId = options.runId;
    this.cleanupOnFailure = options.cleanupOnFailure;
  }

  /**
   * Load input from storage
   */
  async loadInput(inputPath: string): Promise<unknown> {
    await this.ensureTempDir();
    const content = await this.storageProvider.download(inputPath);
    return JSON.parse(content.toString('utf-8'));
  }

  /**
   * Load upstream outputs and register their assets
   */
  async loadUpstream(upstreamRefs: Record<string, UpstreamRef>): Promise<Record<string, unknown>> {
    const upstream: Record<string, unknown> = {};

    for (const [taskId, ref] of Object.entries(upstreamRefs)) {
      const content = await this.storageProvider.download(ref.outputPath);
      upstream[taskId] = JSON.parse(content.toString('utf-8'));

      // Register upstream assets for lazy loading
      if (ref.assets) {
        for (const [key, metadata] of Object.entries(ref.assets)) {
          this.upstreamAssets.set(key, {
            type: metadata.type,
            storagePath: metadata.path,
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

    const content = await this.storageProvider.download(upstream.storagePath);
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
   * Dehydrate: upload output and assets to storage
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
    await this.storageProvider.upload(outputPath, outputContent, 'application/json');

    // Upload assets
    const assets: Record<string, AssetMetadata> = {};
    for (const [key, asset] of this.localAssets) {
      const content = await readFile(asset.localPath);
      const assetPath = `${basePath}/assets/${key}`;
      const contentType = this.getContentType(asset.type);

      await this.storageProvider.upload(assetPath, content, contentType);

      assets[key] = {
        path: assetPath,
        size: content.length,
        type: asset.type,
      };
    }

    // Upload logs
    const logsContent = this.logs.map((l) => JSON.stringify(l)).join('\n');
    const logsPath = `${basePath}/logs.jsonl`;
    await this.storageProvider.upload(logsPath, logsContent, 'application/x-ndjson');

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
}