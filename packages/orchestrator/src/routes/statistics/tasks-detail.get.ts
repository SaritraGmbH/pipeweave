import type { Request, Response } from 'express';
import type { OrchestratorRequest } from '../../types/internal.js';
import { StatisticsService } from '../../core/statistics.js';
import logger from '../../logger.js';

/**
 * GET /statistics/tasks/:taskId
 * Get task-level statistics
 *
 * Query params:
 * - from: ISO timestamp (required)
 * - to: ISO timestamp (required)
 * - bucket: '1m' | '1h' | '1d' (default: '1m')
 */
export async function getTaskStatistics(req: Request, res: Response): Promise<void> {
  const { orchestrator } = req as OrchestratorRequest;
  const { taskId } = req.params;
  const { from, to, bucket } = req.query;

  // Validate query params
  if (!from || !to) {
    res.status(400).json({
      error: 'Missing required query parameters: from, to',
    });
    return;
  }

  const fromDate = new Date(from as string);
  const toDate = new Date(to as string);

  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    res.status(400).json({
      error: 'Invalid date format. Use ISO 8601 format.',
    });
    return;
  }

  if (fromDate >= toDate) {
    res.status(400).json({
      error: 'from must be before to',
    });
    return;
  }

  const bucketSize = (bucket as '1m' | '1h' | '1d') || '1m';
  if (!['1m', '1h', '1d'].includes(bucketSize)) {
    res.status(400).json({
      error: 'Invalid bucket size. Must be one of: 1m, 1h, 1d',
    });
    return;
  }

  // Verify task exists
  const db = orchestrator.getDatabase();
  const task = await db.oneOrNone('SELECT id FROM tasks WHERE id = $1', [taskId]);
  if (!task) {
    res.status(404).json({
      error: 'Task not found',
    });
    return;
  }

  try {
    const statisticsService = new StatisticsService(db);
    const statistics = await statisticsService.getStatistics({
      scope: 'task',
      scopeId: taskId,
      from: fromDate,
      to: toDate,
      bucket: bucketSize,
    });

    res.json(statistics);
  } catch (error) {
    logger.error('Failed to get task statistics', { error, taskId });
    res.status(500).json({
      error: 'Failed to get task statistics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
