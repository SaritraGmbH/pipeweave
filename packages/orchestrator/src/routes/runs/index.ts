import type { Application } from 'express';
import { listRuns } from './list.get.js';
import { getRunDetail } from './detail.get.js';

/**
 * Register all run routes
 */
export function registerRunRoutes(app: Application): void {
  app.get('/api/runs', listRuns);
  app.get('/api/runs/:id', getRunDetail);
}
