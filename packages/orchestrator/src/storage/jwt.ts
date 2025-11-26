import crypto from 'node:crypto';
import type { StorageBackendConfig } from '@pipeweave/shared';
import type { StorageJWTPayload } from '../types/internal.js';

// ============================================================================
// JWT Encryption/Decryption for Storage Credentials
// ============================================================================

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

/**
 * Derive encryption key from secret using PBKDF2
 */
function deriveKey(secret: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(secret, salt, 100000, 32, 'sha256');
}

/**
 * Encrypt storage backend configuration into a JWT-like token
 */
export function encryptStorageToken(
  backend: StorageBackendConfig,
  secretKey: string,
  expiresInSeconds?: number
): string {
  const payload: StorageJWTPayload = {
    id: backend.id,
    provider: backend.provider,
    endpoint: backend.endpoint,
    bucket: backend.bucket,
    region: backend.region,
    credentials: backend.credentials,
    iat: Math.floor(Date.now() / 1000),
  };

  if (expiresInSeconds) {
    payload.exp = payload.iat + expiresInSeconds;
  }

  const payloadStr = JSON.stringify(payload);
  const payloadBuffer = Buffer.from(payloadStr, 'utf8');

  // Generate random salt and IV
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);

  // Derive key from secret + salt
  const key = deriveKey(secretKey, salt);

  // Encrypt
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(payloadBuffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Combine: salt + iv + authTag + encrypted
  const combined = Buffer.concat([salt, iv, authTag, encrypted]);

  // Return as base64url (URL-safe)
  return combined.toString('base64url');
}

/**
 * Decrypt storage token and return backend configuration
 */
export function decryptStorageToken(
  token: string,
  secretKey: string
): StorageJWTPayload {
  const combined = Buffer.from(token, 'base64url');

  // Extract components
  const salt = combined.subarray(0, SALT_LENGTH);
  const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = combined.subarray(
    SALT_LENGTH + IV_LENGTH,
    SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
  );
  const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

  // Derive key from secret + salt
  const key = deriveKey(secretKey, salt);

  // Decrypt
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  const payloadStr = decrypted.toString('utf8');
  const payload = JSON.parse(payloadStr) as StorageJWTPayload;

  // Check expiration
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Storage token has expired');
  }

  return payload;
}

/**
 * Validate storage token without fully decrypting
 * (useful for checking validity before passing to workers)
 */
export function validateStorageToken(token: string, secretKey: string): boolean {
  try {
    decryptStorageToken(token, secretKey);
    return true;
  } catch {
    return false;
  }
}
