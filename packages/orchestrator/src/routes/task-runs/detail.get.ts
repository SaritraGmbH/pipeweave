import type { Request, Response } from 'express';
import type { OrchestratorRequest } from '../../types/internal.js';
import logger from '../../logger.js';

/**
 * GET /api/task-runs/:id
 * Get task run details
 */
export async function getTaskRunDetail(req: Request, res: Response): Promise<void> {
  const orchestratorReq = req as OrchestratorRequest;
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Task run ID is required' });
      return;
    }

    // TODO: Implement task run details
    res.status(501).json({ error: 'Not implemented yet', taskRunId: id });
  } catch (error) {
    logger.error('[task-runs] Failed to get task run', { error });
    res.status(500).json({
      error: 'Failed to get task run',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
