import type { Request, Response } from 'express';
import type { OrchestratorRequest } from '../../types/internal.js';
import logger from '../../logger.js';

/**
 * POST /api/tick
 * Process pending tasks (serverless mode trigger)
 *
 * This endpoint is called by external schedulers (Cloud Scheduler, cron, etc.)
 * to trigger task processing in serverless mode.
 */
export async function processTick(req: Request, res: Response): Promise<void> {
  try {
    const orchestrator = (req as OrchestratorRequest).orchestrator;

    // Get poller instance
    const poller = orchestrator.getPoller();
    if (!poller) {
      res.status(503).json({
        error: 'Poller not available',
        processed: 0,
      });
      return;
    }

    // Trigger manual poll
    const processed = await poller.manualPoll();

    res.json({
      status: 'ok',
      processed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('[queue] Failed to process tick', { error });
    res.status(500).json({
      error: 'Failed to process tick',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
