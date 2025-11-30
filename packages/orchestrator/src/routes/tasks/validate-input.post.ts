import type { Request, Response } from 'express';
import type { OrchestratorRequest } from '../../types/internal.js';
import { validateInput, type TaskInputSchema } from '@pipeweave/shared';
import logger from '../../logger.js';

/**
 * POST /api/tasks/:id/validate-input
 * Validate input against task schema without executing
 */
export async function validateTaskInput(req: Request, res: Response): Promise<void> {
  const orchestratorReq = req as OrchestratorRequest;
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Task ID is required' });
      return;
    }

    const { input } = req.body;
    if (input === undefined) {
      res.status(400).json({ error: 'Input is required' });
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

    // Validate input (returns valid=true if no schema)
    const result = validateInput(input, task.input_schema || undefined);

    res.json({
      valid: result.valid,
      errors: result.errors,
    });
  } catch (error) {
    logger.error('[tasks] Failed to validate input', { error });
    res.status(500).json({
      error: 'Failed to validate input',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
