import { createDecipheriv, createCipheriv, randomBytes } from 'node:crypto';
import type { StorageBackendCredentials } from '@pipeweave/shared';

// Re-export for backward compatibility
export type { StorageBackendCredentials as StorageCredentials };

// ============================================================================
// Constants
// ============================================================================

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

// ============================================================================
// Encryption/Decryption
// ============================================================================

/**
 * Decrypt a storage token (JWT with storage backend credentials)
 */
export function decryptStorageToken(token: string, secretKey: string): StorageBackendCredentials {
  // Token format: base64(iv):base64(authTag):base64(encrypted)
  const parts = token.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid storage token format');
  }

  const [ivB64, authTagB64, encryptedB64] = parts;
  if (!ivB64 || !authTagB64 || !encryptedB64) {
    throw new Error('Invalid storage token format');
  }
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const encrypted = Buffer.from(encryptedB64, 'base64');

  // Derive key from secret (should match orchestrator)
  const key = deriveKey(secretKey);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  return JSON.parse(decrypted.toString('utf-8')) as StorageBackendCredentials;
}

/**
 * Encrypt credentials to a storage token (for testing)
 */
export function encryptStorageToken(credentials: StorageBackendCredentials, secretKey: string): string {
  const iv = randomBytes(IV_LENGTH);
  const key = deriveKey(secretKey);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const plaintext = Buffer.from(JSON.stringify(credentials), 'utf-8');

  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

/**
 * Derive a 32-byte key from the secret
 */
function deriveKey(secret: string): Buffer {
  // Simple key derivation - in production, consider using PBKDF2 or scrypt
  const hash = Buffer.alloc(32);
  const secretBuffer = Buffer.from(secret, 'utf-8');

  for (let i = 0; i < 32; i++) {
    const byteIndex = i % secretBuffer.length;
    hash[i] = secretBuffer[byteIndex] ?? 0;
  }

  return hash;
}