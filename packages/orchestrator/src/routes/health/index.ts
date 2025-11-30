import type { Application } from 'express';
import { healthCheck } from './check.get.js';
import { getInfo } from './info.get.js';

/**
 * Register all health routes
 */
export function registerHealthRoutes(app: Application): void {
  app.get('/health', healthCheck);
  app.get('/api/info', getInfo);
}
