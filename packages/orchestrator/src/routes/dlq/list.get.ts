import type { Request, Response } from 'express';
import logger from '../../logger.js';

/**
 * GET /api/dlq
 * List DLQ items (paginated, filtered)
 */
export async function listDLQItems(_req: Request, res: Response): Promise<void> {
  try {
    // TODO: Implement DLQ listing
    res.status(501).json({ error: 'Not implemented yet' });
  } catch (error) {
    logger.error('[dlq] Failed to list DLQ items', { error });
    res.status(500).json({
      error: 'Failed to list DLQ items',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
