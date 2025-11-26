import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { BaseStorageProvider, type IStorageProvider } from '@pipeweave/shared';
import type { StorageBackendCredentials, AWSS3Credentials } from '@pipeweave/shared';

/**
 * AWS S3 storage provider
 */
export class AWSS3Provider extends BaseStorageProvider implements IStorageProvider {
  private client: S3Client;
  private bucket: string;

  constructor(credentials: StorageBackendCredentials) {
    super(credentials);

    if (credentials.provider !== 'aws-s3') {
      throw new Error(`Invalid provider for AWSS3Provider: ${credentials.provider}`);
    }

    const awsCredentials = credentials.credentials as AWSS3Credentials;

    this.client = new S3Client({
      region: credentials.region || 'us-east-1',
      credentials: {
        accessKeyId: awsCredentials.accessKeyId,
        secretAccessKey: awsCredentials.secretAccessKey,
        sessionToken: awsCredentials.sessionToken,
      },
      endpoint: credentials.endpoint !== 'https://s3.amazonaws.com' ? credentials.endpoint : undefined,
    });

    this.bucket = credentials.bucket;
  }

  get provider() {
    return 'aws-s3' as const;
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
      throw new Error(`Failed to download from S3: ${error.message}`);
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
      throw new Error(`Failed to upload to S3: ${error.message}`);
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
      throw new Error(`Failed to check S3 object existence: ${error.message}`);
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
      throw new Error(`Failed to delete from S3: ${error.message}`);
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
      throw new Error(`Failed to list S3 objects: ${error.message}`);
    }
  }
}
