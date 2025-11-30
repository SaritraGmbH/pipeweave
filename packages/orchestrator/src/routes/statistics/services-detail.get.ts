import type { Request, Response } from 'express';
import type { OrchestratorRequest } from '../../types/internal.js';
import { StatisticsService } from '../../core/statistics.js';
import logger from '../../logger.js';

/**
 * GET /api/statistics/services/:serviceId
 * Get service-level statistics (all tasks belonging to this service)
 *
 * Query params:
 * - from: ISO timestamp (required)
 * - to: ISO timestamp (required)
 * - bucket: '1m' | '1h' | '1d' (default: '1m')
 */
export async function getServiceStatistics(req: Request, res: Response): Promise<void> {
  const { orchestrator } = req as OrchestratorRequest;
  const { serviceId } = req.params;
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

  // Verify service exists
  const db = orchestrator.getDatabase();
  const service = await db.oneOrNone('SELECT id FROM services WHERE id = $1', [serviceId]);
  if (!service) {
    res.status(404).json({
      error: 'Service not found',
    });
    return;
  }

  try {
    const statisticsService = new StatisticsService(db);
    const statistics = await statisticsService.getStatistics({
      scope: 'service',
      scopeId: serviceId,
      from: fromDate,
      to: toDate,
      bucket: bucketSize,
    });

    res.json(statistics);
  } catch (error) {
    logger.error('Failed to get service statistics', { error, serviceId });
    res.status(500).json({
      error: 'Failed to get service statistics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
