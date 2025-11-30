import type { Application } from 'express';
import { getSystemStatistics } from './system.get.js';
import { getServiceStatistics } from './services-detail.get.js';
import { getTaskStatistics } from './tasks-detail.get.js';
import { getPipelineStatistics } from './pipelines-detail.get.js';
import { getQueueStatistics } from './queue.get.js';

/**
 * Register all statistics routes
 */
export function registerStatisticsRoutes(app: Application): void {
  // System-wide statistics
  app.get('/api/statistics/system', getSystemStatistics);

  // Service-level statistics
  app.get('/api/statistics/services/:serviceId', getServiceStatistics);

  // Task-level statistics
  app.get('/api/statistics/tasks/:taskId', getTaskStatistics);

  // Pipeline-level statistics
  app.get('/api/statistics/pipelines/:pipelineId', getPipelineStatistics);

  // Real-time queue statistics
  app.get('/api/statistics/queue', getQueueStatistics);
}
