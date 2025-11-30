import type { Request, Response } from 'express';
import type { OrchestratorRequest } from '../../types/internal.js';
import { PipelineExecutor } from '../../pipeline/executor.js';
import { DryRunRequestSchema } from '@pipeweave/shared';
import logger from '../../logger.js';

/**
 * POST /api/pipelines/:id/dry-run
 * Validate pipeline without executing
 */
export async function dryRunPipeline(req: Request, res: Response): Promise<void> {
  const orchestratorReq = req as OrchestratorRequest;
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Pipeline ID is required' });
      return;
    }
    const orchestrator = orchestratorReq.orchestrator;

    // Validate request body
    const parseResult = DryRunRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Invalid request',
        details: parseResult.error.format(),
      });
      return;
    }

    const db = orchestrator.getDatabase();
    const executor = new PipelineExecutor(db, orchestrator, 'storage');

    const result = await executor.dryRun(id);

    res.json(result);
  } catch (error) {
    logger.error('[pipelines] Failed to validate pipeline', { error });
    res.status(500).json({
      error: 'Failed to validate pipeline',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
