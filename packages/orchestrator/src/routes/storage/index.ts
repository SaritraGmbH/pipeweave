import type { Application } from 'express';
import { getStorageBackends } from './backends.get.js';
import { getStorageContent } from './proxy.get.js';

/**
 * Register all storage routes
 */
export function registerStorageRoutes(app: Application): void {
  app.get('/api/storage/backends', getStorageBackends);
  app.get('/api/storage/*', getStorageContent);
}
