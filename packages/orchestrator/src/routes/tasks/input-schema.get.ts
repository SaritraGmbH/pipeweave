import type { Request, Response } from 'express';
import type { OrchestratorRequest } from '../../types/internal.js';
import type { TaskInputSchema } from '@pipeweave/shared';
import logger from '../../logger.js';

/**
 * GET /api/tasks/:id/input-schema
 * Get input schema for a task
 */
export async function getTaskInputSchema(req: Request, res: Response): Promise<void> {
  const orchestratorReq = req as OrchestratorRequest;
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Task ID is required' });
      return;
    }
    const orchestrator = orchestratorReq.orchestrator;
    const db = orchestrator.getDatabase();

    const task = await db.oneOrNone<{ input_schema: TaskInputSchema | null }>(
      'SELECT input_schema FROM tasks WHERE id = $1',
      [id]
    );

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.json({
      taskId: id,
      hasSchema: !!task.input_schema,
      schema: task.input_schema || null,
    });
  } catch (error) {
    logger.error('[tasks] Failed to get input schema', { error });
    res.status(500).json({
      error: 'Failed to get input schema',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
