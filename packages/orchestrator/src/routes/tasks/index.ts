import type { Application } from 'express';
import { getTaskHistory } from './history.get.js';
import { getTaskInputSchema } from './input-schema.get.js';
import { validateTaskInput } from './validate-input.post.js';

/**
 * Register all task routes
 */
export function registerTaskRoutes(app: Application): void {
  app.get('/api/tasks/:id/history', getTaskHistory);
  app.get('/api/tasks/:id/input-schema', getTaskInputSchema);
  app.post('/api/tasks/:id/validate-input', validateTaskInput);
}
