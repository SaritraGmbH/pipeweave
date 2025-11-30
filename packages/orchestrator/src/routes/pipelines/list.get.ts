import type { Request, Response } from 'express';
import type { OrchestratorRequest } from '../../types/internal.js';
import { PipelineExecutor } from '../../pipeline/executor.js';
import logger from '../../logger.js';

/**
 * GET /api/pipelines
 * List all pipelines
 */
export async function listPipelines(req: Request, res: Response): Promise<void> {
  const orchestratorReq = req as OrchestratorRequest;
  try {
    const orchestrator = orchestratorReq.orchestrator;
    const db = orchestrator.getDatabase();
    const executor = new PipelineExecutor(db, orchestrator, 'storage');

    const pipelines = await executor.listPipelines();

    res.json({ pipelines });
  } catch (error) {
    logger.error('[pipelines] Failed to list pipelines', { error });
    res.status(500).json({
      error: 'Failed to list pipelines',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
