import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { BaseStorageProvider, type IStorageProvider } from '@pipeweave/shared';
import type { StorageBackendCredentials, MinIOCredentials } from '@pipeweave/shared';

/**
 * MinIO storage provider (S3-compatible)
 */
export class MinIOProvider extends BaseStorageProvider implements IStorageProvider {
  private client: S3Client;
  private bucket: string;

  constructor(credentials: StorageBackendCredentials) {
    super(credentials);

    if (credentials.provider !== 'minio') {
      throw new Error(`Invalid provider for MinIOProvider: ${credentials.provider}`);
    }

    const minioCredentials = credentials.credentials as MinIOCredentials;

    // MinIO uses path-style URLs and custom endpoint
    this.client = new S3Client({
      region: credentials.region || 'us-east-1', // MinIO doesn't care about region, but SDK requires it
      credentials: {
        accessKeyId: minioCredentials.accessKey,
        secretAccessKey: minioCredentials.secretKey,
      },
      endpoint: credentials.endpoint,
      forcePathStyle: true, // MinIO requires path-style URLs
      tls: credentials.endpoint.startsWith('https'),
    });

    this.bucket = credentials.bucket;
  }

  get provider() {
    return 'minio' as const;
  }

  async download(path: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: path,
    });

    try {
      const response = await this.client.send(command);

      if (!response.Body) {
        throw new Error('Empty response body');
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }

      return Buffer.concat(chunks);
    } catch (error: any) {
      throw new Error(`Failed to download from MinIO: ${error.message}`);
    }
  }

  async upload(path: string, content: Buffer | string, contentType: string): Promise<void> {
    const buffer = this.toBuffer(content);

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: path,
      Body: buffer,
      ContentType: contentType,
    });

    try {
      await this.client.send(command);
    } catch (error: any) {
      throw new Error(`Failed to upload to MinIO: ${error.message}`);
    }
  }

  async exists(path: string): Promise<boolean> {
    const command = new HeadObjectCommand({
      Bucket: this.bucket,
      Key: path,
    });

    try {
      await this.client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw new Error(`Failed to check MinIO object existence: ${error.message}`);
    }
  }

  async delete(path: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: path,
    });

    try {
      await this.client.send(command);
    } catch (error: any) {
      throw new Error(`Failed to delete from MinIO: ${error.message}`);
    }
  }

  async list(prefix: string, maxKeys: number = 1000): Promise<string[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix,
      MaxKeys: maxKeys,
    });

    try {
      const response = await this.client.send(command);
      return (response.Contents || []).map((obj) => obj.Key!).filter(Boolean);
    } catch (error: any) {
      throw new Error(`Failed to list MinIO objects: ${error.message}`);
    }
  }
}
