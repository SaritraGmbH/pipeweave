import type { Request, Response } from 'express';
import type { OrchestratorRequest } from '../../types/internal.js';
import { PipelineExecutor } from '../../pipeline/executor.js';
import logger from '../../logger.js';

/**
 * GET /api/pipelines/:id
 * Get pipeline details
 */
export async function getPipelineDetail(req: Request, res: Response): Promise<void> {
  const orchestratorReq = req as OrchestratorRequest;
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Pipeline ID is required' });
      return;
    }
    const orchestrator = orchestratorReq.orchestrator;
    const db = orchestrator.getDatabase();
    const executor = new PipelineExecutor(db, orchestrator, 'storage');

    const pipeline = await executor.getPipeline(id);

    if (!pipeline) {
      res.status(404).json({
        error: 'Pipeline not found',
        pipelineId: id,
      });
      return;
    }

    res.json({ pipeline });
  } catch (error) {
    logger.error('[pipelines] Failed to get pipeline', { error });
    res.status(500).json({
      error: 'Failed to get pipeline',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
