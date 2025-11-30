import type { Request, Response } from 'express';
import { nanoid } from 'nanoid';
import type { OrchestratorRequest } from '../../types/internal.js';
import logger from '../../logger.js';

/**
 * POST /api/upload/temp
 * Upload a file to temporary storage.
 *
 * Returns upload ID that can be used in task input.
 * Files expire after 24 hours if not claimed by a task run.
 */
export async function uploadTempFile(req: Request, res: Response): Promise<void> {
  try {
    const orchestrator = (req as OrchestratorRequest).orchestrator;

    if (!req.file) {
      res.status(400).json({ error: 'No file provided' });
      return;
    }

    const uploadId = `tmp_${nanoid()}`;
    const filename = req.file.originalname || `upload-${Date.now()}`;
    const storagePath = `temp-uploads/${uploadId}/${filename}`;

    // Upload to default storage backend
    const storage = (orchestrator as any).defaultStorageBackend;

    await storage.putObject(storagePath, req.file.buffer, req.file.mimetype);

    // Record in temp_uploads table
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await orchestrator.getDatabase().none(
      `INSERT INTO temp_uploads
       (id, storage_path, storage_backend_id, uploaded_at, expires_at,
        original_filename, mime_type, size_bytes, uploaded_by)
       VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, $8)`,
      [
        uploadId,
        storagePath,
        storage.id,
        expiresAt,
        req.file.originalname,
        req.file.mimetype,
        req.file.size,
        req.headers['x-user-id'] || req.ip || 'anonymous',
      ]
    );

    logger.info('[upload] Temp file uploaded', {
      uploadId,
      filename: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
    });

    res.json({
      uploadId,
      storagePath,
      filename: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    logger.error('[upload] Upload failed', { error });
    res.status(500).json({
      error: 'Upload failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
