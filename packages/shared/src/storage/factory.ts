import type { StorageBackendCredentials } from '../types/storage.js';
import type { IStorageProvider } from './base.js';

// ============================================================================
// Storage Provider Factory
// ============================================================================

/**
 * Provider constructor type
 */
export type StorageProviderConstructor = new (credentials: StorageBackendCredentials) => IStorageProvider;

/**
 * Registry of storage providers
 */
const providerRegistry = new Map<string, StorageProviderConstructor>();

/**
 * Register a storage provider implementation
 * @param provider - Provider type
 * @param constructor - Provider class constructor
 */
export function registerStorageProvider(
  provider: string,
  constructor: StorageProviderConstructor
): void {
  providerRegistry.set(provider, constructor);
}

/**
 * Create a storage provider instance
 * @param credentials - Storage backend credentials
 * @returns Storage provider instance
 */
export function createStorageProvider(credentials: StorageBackendCredentials): IStorageProvider {
  const ProviderClass = providerRegistry.get(credentials.provider);

  if (!ProviderClass) {
    throw new Error(
      `Storage provider '${credentials.provider}' not registered. ` +
      `Available providers: ${Array.from(providerRegistry.keys()).join(', ')}`
    );
  }

  return new ProviderClass(credentials);
}

/**
 * Get list of registered providers
 */
export function getRegisteredProviders(): string[] {
  return Array.from(providerRegistry.keys());
}
