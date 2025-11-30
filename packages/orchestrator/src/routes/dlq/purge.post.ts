import type { Request, Response } from 'express';
import logger from '../../logger.js';

/**
 * POST /api/dlq/purge
 * Purge old DLQ entries
 */
export async function purgeDLQ(_req: Request, res: Response): Promise<void> {
  try {
    // TODO: Implement DLQ purge
    res.status(501).json({ error: 'Not implemented yet' });
  } catch (error) {
    logger.error('[dlq] Failed to purge DLQ', { error });
    res.status(500).json({
      error: 'Failed to purge DLQ',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
