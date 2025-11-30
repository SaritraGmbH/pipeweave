import type { Request, Response } from 'express';
import logger from '../../logger.js';

/**
 * GET /api/runs
 * List pipeline runs (paginated, filtered)
 */
export async function listRuns(_req: Request, res: Response): Promise<void> {
  try {
    // TODO: Implement run listing
    res.status(501).json({ error: 'Not implemented yet' });
  } catch (error) {
    logger.error('[runs] Failed to list runs', { error });
    res.status(500).json({
      error: 'Failed to list runs',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
