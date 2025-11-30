import type { Request, Response } from 'express';
import logger from '../../logger.js';

/**
 * GET /api/services
 * List all registered services
 */
export async function listServices(_req: Request, res: Response): Promise<void> {
  try {
    // TODO: Implement service listing
    res.status(501).json({ error: 'Not implemented yet' });
  } catch (error) {
    logger.error('[services] Failed to list services', { error });
    res.status(500).json({
      error: 'Failed to list services',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
