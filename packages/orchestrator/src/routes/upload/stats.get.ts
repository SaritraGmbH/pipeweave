import type { Request, Response } from 'express';
import type { OrchestratorRequest } from '../../types/internal.js';
import logger from '../../logger.js';

/**
 * GET /api/upload/stats
 * Get statistics about temporary uploads.
 */
export async function getUploadStats(req: Request, res: Response): Promise<void> {
  try {
    const orchestrator = (req as OrchestratorRequest).orchestrator;

    const row = await orchestrator.getDatabase().one<{
      total: string;
      expired: string;
      claimed: string;
      deleted: string;
    }>(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE expires_at < NOW() AND deleted_at IS NULL) as expired,
        COUNT(*) FILTER (WHERE claimed_by_run_id IS NOT NULL) as claimed,
        COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as deleted
       FROM temp_uploads`
    );

    res.json({
      total: parseInt(row.total, 10),
      expired: parseInt(row.expired, 10),
      claimed: parseInt(row.claimed, 10),
      deleted: parseInt(row.deleted, 10),
    });
  } catch (error) {
    logger.error('[upload] Failed to get upload stats', { error });
    res.status(500).json({
      error: 'Failed to get upload stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
