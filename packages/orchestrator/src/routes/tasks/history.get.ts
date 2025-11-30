import type { Request, Response } from 'express';
import type { OrchestratorRequest } from '../../types/internal.js';
import logger from '../../logger.js';

/**
 * GET /api/tasks/:id/history
 * Task code change history
 */
export async function getTaskHistory(req: Request, res: Response): Promise<void> {
  const orchestratorReq = req as OrchestratorRequest;
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Task ID is required' });
      return;
    }
    const orchestrator = orchestratorReq.orchestrator;
    const db = orchestrator.getDatabase();

    const history = await db.manyOrNone(
      `SELECT code_version, code_hash, service_version, recorded_at
       FROM task_code_history
       WHERE task_id = $1
       ORDER BY code_version DESC`,
      [id]
    );

    res.json({ history });
  } catch (error) {
    logger.error('[tasks] Failed to get task history', { error });
    res.status(500).json({
      error: 'Failed to get task history',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
