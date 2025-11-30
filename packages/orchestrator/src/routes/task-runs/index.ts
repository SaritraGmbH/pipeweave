import type { Application } from 'express';
import { taskRunHeartbeat } from './heartbeat.post.js';
import { completeTaskRun } from './complete.post.js';
import { getTaskRunDetail } from './detail.get.js';

/**
 * Register all task-run routes
 */
export function registerTaskRunRoutes(app: Application): void {
  app.post('/api/task-runs/:runId/heartbeat', taskRunHeartbeat);
  app.post('/api/task-runs/:runId/complete', completeTaskRun);
  app.get('/api/task-runs/:id', getTaskRunDetail);
}
