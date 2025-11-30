import type { Request, Response } from 'express';
import type { OrchestratorRequest } from '../../types/internal.js';
import { createStorageProvider } from '@pipeweave/shared';
import logger from '../../logger.js';

/**
 * DELETE /api/upload/temp/:id
 * Manually delete a temporary upload before it expires.
 */
export async function deleteTempUpload(req: Request, res: Response): Promise<void> {
  try {
    const orchestrator = (req as OrchestratorRequest).orchestrator;
    const { id } = req.params;

    // Get upload info
    const upload = await orchestrator.getDatabase().oneOrNone(
      `SELECT storage_path, storage_backend_id, deleted_at, claimed_by_run_id
       FROM temp_uploads
       WHERE id = $1`,
      [id]
    );

    if (!upload) {
      res.status(404).json({ error: 'Upload not found' });
      return;
    }

    if (upload.deleted_at) {
      res.status(410).json({ error: 'Upload already deleted' });
      return;
    }

    if (upload.claimed_by_run_id) {
      res.status(409).json({
        error: 'Upload already claimed by task run',
        claimedByRunId: upload.claimed_by_run_id,
      });
      return;
    }

    // Delete from storage
    const storageBackend = orchestrator.getStorageBackend(upload.storage_backend_id);
    const storage = createStorageProvider(storageBackend);
    await storage.delete(upload.storage_path);

    // Mark as deleted
    await orchestrator.getDatabase().none(`UPDATE temp_uploads SET deleted_at = NOW() WHERE id = $1`, [
      id,
    ]);

    logger.info('[upload] Temp file deleted manually', { uploadId: id });

    res.json({ success: true, uploadId: id });
  } catch (error) {
    logger.error('[upload] Failed to delete upload', { error, uploadId: req.params.id });
    res.status(500).json({
      error: 'Failed to delete upload',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
