import type { Request, Response } from 'express';
import logger from '../../logger.js';

/**
 * GET /api/services/:id/tasks
 * List tasks for a service
 */
export async function getServiceTasks(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    // TODO: Implement task listing for service
    res.status(501).json({ error: 'Not implemented yet', serviceId: id });
  } catch (error) {
    logger.error('[services] Failed to list tasks', { error });
    res.status(500).json({
      error: 'Failed to list tasks',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
