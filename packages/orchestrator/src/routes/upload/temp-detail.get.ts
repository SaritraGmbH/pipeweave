import type { Request, Response } from 'express';
import type { OrchestratorRequest } from '../../types/internal.js';
import logger from '../../logger.js';

/**
 * GET /api/upload/temp/:id
 * Get information about a temporary upload.
 */
export async function getTempUploadDetail(req: Request, res: Response): Promise<void> {
  try {
    const orchestrator = (req as OrchestratorRequest).orchestrator;
    const { id } = req.params;

    const upload = await orchestrator.getDatabase().oneOrNone(
      `SELECT id, storage_path, storage_backend_id, uploaded_at, expires_at,
              claimed_by_run_id, deleted_at, original_filename, mime_type, size_bytes
       FROM temp_uploads
       WHERE id = $1`,
      [id]
    );

    if (!upload) {
      res.status(404).json({ error: 'Upload not found' });
      return;
    }

    res.json({
      uploadId: upload.id,
      storagePath: upload.storage_path,
      storageBackendId: upload.storage_backend_id,
      uploadedAt: upload.uploaded_at,
      expiresAt: upload.expires_at,
      claimedByRunId: upload.claimed_by_run_id,
      deletedAt: upload.deleted_at,
      filename: upload.original_filename,
      mimeType: upload.mime_type,
      size: upload.size_bytes,
      expired: new Date(upload.expires_at) < new Date(),
      claimed: !!upload.claimed_by_run_id,
      deleted: !!upload.deleted_at,
    });
  } catch (error) {
    logger.error('[upload] Failed to get upload info', { error, uploadId: req.params.id });
    res.status(500).json({
      error: 'Failed to get upload info',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
