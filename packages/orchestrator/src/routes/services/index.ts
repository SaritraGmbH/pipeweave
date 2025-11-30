import type { Application } from 'express';
import { listServices } from './list.get.js';
import { createService } from './create.post.js';
import { getServiceDetail } from './detail.get.js';
import { getServiceTasks } from './tasks.get.js';

/**
 * Register all service routes
 */
export function registerServiceRoutes(app: Application): void {
  app.get('/api/services', listServices);
  app.post('/api/services', createService);
  app.get('/api/services/:id', getServiceDetail);
  app.get('/api/services/:id/tasks', getServiceTasks);
}
