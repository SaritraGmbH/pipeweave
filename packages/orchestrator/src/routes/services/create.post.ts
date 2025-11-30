import type { Request, Response } from 'express';
import logger from '../../logger.js';

/**
 * POST /api/services
 * Worker registration (RESTful: creates a new service)
 */
export async function createService(_req: Request, res: Response): Promise<void> {
  try {
    // TODO: Implement service registration
    res.status(501).json({ error: 'Not implemented yet' });
  } catch (error) {
    logger.error('[services] Registration failed', { error });
    res.status(500).json({
      error: 'Registration failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
