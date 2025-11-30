import type { Request, Response } from 'express';
import type { OrchestratorRequest } from '../../types/internal.js';
import { HeartbeatRequestSchema } from '@pipeweave/shared';
import logger from '../../logger.js';

/**
 * POST /api/task-runs/:runId/heartbeat
 * Worker heartbeat and progress update
 */
export async function taskRunHeartbeat(req: Request, res: Response): Promise<void> {
  const orchestratorReq = req as OrchestratorRequest;
  try {
    const orchestrator = orchestratorReq.orchestrator;
    const db = orchestrator.getDatabase();
    const { runId } = req.params;

    // Validate request
    const parseResult = HeartbeatRequestSchema.safeParse({
      runId,
      ...req.body,
    });
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Invalid request',
        details: parseResult.error.format(),
      });
      return;
    }

    const { progress, message } = parseResult.data;

    // Update heartbeat in database
    await db.none(
      `UPDATE task_runs
       SET heartbeat_at = NOW(),
           metadata = CASE
             WHEN $2::INTEGER IS NOT NULL THEN jsonb_set(metadata, '{progress}', to_jsonb($2))
             ELSE metadata
           END
       WHERE id = $1 AND status = 'running'`,
      [runId, progress ?? null]
    );

    res.json({
      acknowledged: true,
      shouldCancel: false,
    });
  } catch (error) {
    logger.error('[task-runs] Failed to process heartbeat', { error });
    res.status(500).json({
      error: 'Failed to process heartbeat',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
