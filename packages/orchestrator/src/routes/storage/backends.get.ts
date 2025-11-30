import type { Request, Response } from 'express';
import type { OrchestratorRequest } from '../../types/internal.js';
import logger from '../../logger.js';

/**
 * GET /api/storage/backends
 * List all configured storage backends
 */
export async function getStorageBackends(req: Request, res: Response): Promise<void> {
  try {
    const orchestrator = (req as OrchestratorRequest).orchestrator;
    const backendIds = orchestrator.listStorageBackendIds();
    const defaultBackend = (orchestrator as any).defaultStorageBackend;

    const backends = backendIds.map((id) => {
      const backend = orchestrator.getStorageBackend(id);
      return {
        id: backend.id,
        provider: backend.provider,
        endpoint: backend.endpoint,
        bucket: backend.bucket,
        region: backend.region,
        isDefault: backend.id === defaultBackend.id,
      };
    });

    res.json({
      backends,
      default: defaultBackend.id,
    });
  } catch (error) {
    logger.error('[storage] Failed to list storage backends', { error });
    res.status(500).json({
      error: 'Failed to list storage backends',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
