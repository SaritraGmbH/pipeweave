import type { Request, Response } from 'express';
import type { OrchestratorRequest } from '../../types/internal.js';
import { PipelineExecutor } from '../../pipeline/executor.js';
import {
  TriggerPipelineRequestSchema,
  validateInput,
  type TaskInputSchema,
  type ValidationError,
} from '@pipeweave/shared';
import logger from '../../logger.js';

/**
 * POST /api/pipelines/:id/trigger
 * Trigger a pipeline
 */
export async function triggerPipeline(req: Request, res: Response): Promise<void> {
  const orchestratorReq = req as OrchestratorRequest;
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Pipeline ID is required' });
      return;
    }
    const orchestrator = orchestratorReq.orchestrator;

    // Check maintenance mode
    const canAccept = await orchestrator.canAcceptTasks();
    if (!canAccept) {
      res.status(503).json({
        error: 'Orchestrator is in maintenance mode',
      });
      return;
    }

    // Validate request body
    const parseResult = TriggerPipelineRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Invalid request',
        details: parseResult.error.format(),
      });
      return;
    }

    const { input, failureMode, priority, metadata } = parseResult.data;

    const db = orchestrator.getDatabase();

    // Get validation mode from request (default: 'warn')
    const validationMode = (req.body.validationMode as 'strict' | 'warn' | 'none') || 'warn';

    // Validate input against entry task schemas
    const validationErrors: Record<string, ValidationError[]> = {};

    if (validationMode !== 'none') {
      // Get pipeline to find entry tasks
      const pipeline = await db.oneOrNone<{ entry_tasks: string[] }>(
        'SELECT entry_tasks FROM pipelines WHERE id = $1',
        [id]
      );

      if (pipeline && pipeline.entry_tasks.length > 0) {
        // Validate against each entry task schema
        for (const taskId of pipeline.entry_tasks) {
          const task = await db.oneOrNone<{ input_schema: TaskInputSchema | null }>(
            'SELECT input_schema FROM tasks WHERE id = $1',
            [taskId]
          );

          if (task?.input_schema) {
            const result = validateInput(input, task.input_schema);
            if (!result.valid) {
              validationErrors[taskId] = result.errors;
            }
          }
        }
      }
    }

    // Strict mode: fail on validation errors
    if (validationMode === 'strict' && Object.keys(validationErrors).length > 0) {
      res.status(400).json({
        error: 'Input validation failed',
        validationErrors,
      });
      return;
    }

    // Warn mode: log warnings but continue
    if (validationMode === 'warn' && Object.keys(validationErrors).length > 0) {
      logger.warn('[pipelines] Input validation warnings', {
        pipelineId: id,
        validationErrors,
      });
    }

    const executor = new PipelineExecutor(db, orchestrator, 'storage');

    const result = await executor.triggerPipeline({
      pipelineId: id,
      input,
      failureMode,
      priority,
      metadata,
    });

    res.json({
      pipelineRunId: result.pipelineRunId,
      status: result.status,
      inputPath: result.inputPath,
      entryTasks: result.entryTaskIds,
      queuedTasks: result.queuedTasks,
      validationWarnings:
        validationMode === 'warn' && Object.keys(validationErrors).length > 0
          ? validationErrors
          : undefined,
    });
  } catch (error) {
    logger.error('[pipelines] Failed to trigger pipeline', { error });
    res.status(500).json({
      error: 'Failed to trigger pipeline',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
