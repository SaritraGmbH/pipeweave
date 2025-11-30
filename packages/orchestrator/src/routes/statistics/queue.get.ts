import type { Request, Response } from 'express';
import type { OrchestratorRequest } from '../../types/internal.js';
import { StatisticsService } from '../../core/statistics.js';
import logger from '../../logger.js';

/**
 * GET /statistics/queue
 * Get real-time queue statistics
 */
export async function getQueueStatistics(req: Request, res: Response): Promise<void> {
  const { orchestrator } = req as OrchestratorRequest;

  try {
    const statisticsService = new StatisticsService(orchestrator.getDatabase());
    const queueStats = await statisticsService.getQueueStatistics();

    res.json(queueStats);
  } catch (error) {
    logger.error('Failed to get queue statistics', { error });
    res.status(500).json({
      error: 'Failed to get queue statistics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
