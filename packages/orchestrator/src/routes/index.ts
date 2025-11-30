import type { Express } from 'express';
import type { Orchestrator } from '../orchestrator.js';
import { attachOrchestrator } from './middleware/orchestrator.js';
import { registerHealthRoutes } from './health/index.js';
import { registerServiceRoutes } from './services/index.js';
import { registerPipelineRoutes } from './pipelines/index.js';
import { registerQueueRoutes } from './queue/index.js';
import { registerTaskRoutes } from './tasks/index.js';
import { registerTaskRunRoutes } from './task-runs/index.js';
import { registerRunRoutes } from './runs/index.js';
import { registerDLQRoutes } from './dlq/index.js';
import { registerStorageRoutes } from './storage/index.js';
import { registerUploadRoutes } from './upload/index.js';
import { registerStatisticsRoutes } from './statistics/index.js';
import logger from '../logger.js';

// ============================================================================
// Route Registration
// ============================================================================

export function registerRoutes(app: Express, orchestrator: Orchestrator): void {
  // Attach orchestrator to all requests
  app.use(attachOrchestrator(orchestrator));

  // Register all route modules
  registerHealthRoutes(app);
  registerServiceRoutes(app);
  registerPipelineRoutes(app);
  registerQueueRoutes(app);
  registerTaskRoutes(app);
  registerTaskRunRoutes(app);
  registerRunRoutes(app);
  registerDLQRoutes(app);
  registerStorageRoutes(app);
  registerUploadRoutes(app);
  registerStatisticsRoutes(app);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Error handler
  app.use((err: Error, _req: any, res: any, _next: any) => {
    logger.error('[routes] Request error', { error: err });
    res.status(500).json({
      error: 'Internal server error',
      message: err.message,
    });
  });
}
