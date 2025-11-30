import type { Request, Response } from 'express';
import type { OrchestratorRequest } from '../../types/internal.js';
import { createStorageProvider } from '@pipeweave/shared';
import logger from '../../logger.js';

/**
 * GET /api/storage/*
 * Retrieve content from storage (proxy)
 *
 * Example: GET /api/storage/runs/prun_xxx/outputs/trun_yyy.json
 */
export async function getStorageContent(req: Request, res: Response): Promise<void> {
  try {
    const orchestrator = (req as OrchestratorRequest).orchestrator;
    const path = (req as any).params[0];

    if (!path) {
      res.status(400).json({ error: 'Missing storage path' });
      return;
    }

    // Use default storage backend
    const backend = orchestrator.getDefaultStorageBackend();
    const storageProvider = createStorageProvider(backend);

    // Fetch content
    const content = await storageProvider.download(path);

    // Try to parse as JSON if possible
    let parsed: any;
    try {
      parsed = JSON.parse(content.toString('utf8'));
    } catch {
      // Not JSON, return as text
      res.type('text/plain').send(content.toString('utf8'));
      return;
    }

    res.json({
      path,
      content: parsed,
    });
  } catch (error) {
    if ((error as any).code === 'NoSuchKey' || (error as any).code === 'NotFound') {
      res.status(404).json({
        error: 'File not found',
        path: (req as any).params[0],
      });
      return;
    }

    logger.error('[storage] Failed to retrieve storage content', { error });
    res.status(500).json({
      error: 'Failed to retrieve storage content',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
