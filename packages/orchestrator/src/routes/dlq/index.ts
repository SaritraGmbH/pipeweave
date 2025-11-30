import type { Application } from 'express';
import { listDLQItems } from './list.get.js';
import { getDLQItemDetail } from './detail.get.js';
import { retryDLQItem } from './retry.post.js';
import { purgeDLQ } from './purge.post.js';

/**
 * Register all DLQ routes
 */
export function registerDLQRoutes(app: Application): void {
  app.get('/api/dlq', listDLQItems);
  app.get('/api/dlq/:id', getDLQItemDetail);
  app.post('/api/dlq/:id/retry', retryDLQItem);
  app.post('/api/dlq/purge', purgeDLQ);
}
