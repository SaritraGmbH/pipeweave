import type { Request, Response } from 'express';
import logger from '../../logger.js';

/**
 * GET /api/runs/:id
 * Get pipeline run details
 */
export async function getRunDetail(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    // TODO: Implement run details
    res.status(501).json({ error: 'Not implemented yet', runId: id });
  } catch (error) {
    logger.error('[runs] Failed to get run', { error });
    res.status(500).json({
      error: 'Failed to get run',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
