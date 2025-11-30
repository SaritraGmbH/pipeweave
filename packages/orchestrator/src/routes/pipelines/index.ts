import type { Application } from 'express';
import { listPipelines } from './list.get.js';
import { getPipelineDetail } from './detail.get.js';
import { triggerPipeline } from './trigger.post.js';
import { dryRunPipeline } from './dry-run.post.js';

/**
 * Register all pipeline routes
 */
export function registerPipelineRoutes(app: Application): void {
  app.get('/api/pipelines', listPipelines);
  app.get('/api/pipelines/:id', getPipelineDetail);
  app.post('/api/pipelines/:id/trigger', triggerPipeline);
  app.post('/api/pipelines/:id/dry-run', dryRunPipeline);
}
