import type { Storage } from "@google-cloud/storage";
import type {
  GCSCredentials,
  StorageBackendCredentials,
} from "@pipeweave/shared";
import { BaseStorageProvider, type IStorageProvider } from "@pipeweave/shared";

/**
 * Google Cloud Storage provider
 */
export class GCSProvider
  extends BaseStorageProvider
  implements IStorageProvider
{
  private storage: Storage;
  private bucket: string;

  constructor(credentials: StorageBackendCredentials) {
    super(credentials);

    if (credentials.provider !== "gcs") {
      throw new Error(
        `Invalid provider for GCSProvider: ${credentials.provider}`
      );
    }

    const gcsCredentials = credentials.credentials as GCSCredentials;

    // Dynamically import @google-cloud/storage
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Storage: GCSStorage } = require("@google-cloud/storage");

    // Create storage client with service account credentials
    this.storage = new GCSStorage({
      projectId: gcsCredentials.projectId,
      credentials: {
        client_email: gcsCredentials.clientEmail,
        private_key: gcsCredentials.privateKey,
      },
    });

    this.bucket = credentials.bucket;
  }

  get provider() {
    return "gcs" as const;
  }

  async download(path: string): Promise<Buffer> {
    try {
      const file = this.storage.bucket(this.bucket).file(path);
      const [contents] = await file.download();
      return contents;
    } catch (error: any) {
      throw new Error(`Failed to download from GCS: ${error.message}`);
    }
  }

  async upload(
    path: string,
    content: Buffer | string,
    contentType: string
  ): Promise<void> {
    const buffer = this.toBuffer(content);

    try {
      const file = this.storage.bucket(this.bucket).file(path);
      await file.save(buffer, {
        contentType,
        metadata: {
          contentType,
        },
      });
    } catch (error: any) {
      throw new Error(`Failed to upload to GCS: ${error.message}`);
    }
  }

  async exists(path: string): Promise<boolean> {
    try {
      const file = this.storage.bucket(this.bucket).file(path);
      const [exists] = await file.exists();
      return exists;
    } catch (error: any) {
      throw new Error(`Failed to check GCS object existence: ${error.message}`);
    }
  }

  async delete(path: string): Promise<void> {
    try {
      const file = this.storage.bucket(this.bucket).file(path);
      await file.delete();
    } catch (error: any) {
      throw new Error(`Failed to delete from GCS: ${error.message}`);
    }
  }

  async list(prefix: string, maxKeys: number = 1000): Promise<string[]> {
    try {
      const [files] = await this.storage.bucket(this.bucket).getFiles({
        prefix,
        maxResults: maxKeys,
      });

      return files.map((file) => file.name);
    } catch (error: any) {
      throw new Error(`Failed to list GCS objects: ${error.message}`);
    }
  }
}
