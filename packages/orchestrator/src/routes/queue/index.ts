import type { Application } from 'express';
import { queueTask } from './task.post.js';
import { queueBatch } from './batch.post.js';
import { getQueueStatus } from './status.get.js';
import { getQueueItems } from './items.get.js';
import { processTick } from './tick.post.js';

/**
 * Register all queue routes
 */
export function registerQueueRoutes(app: Application): void {
  app.post('/api/queue/task', queueTask);
  app.post('/api/queue/batch', queueBatch);
  app.get('/api/queue/status', getQueueStatus);
  app.get('/api/queue/items', getQueueItems);
  app.post('/api/tick', processTick);
}
