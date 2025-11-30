import type { Request, Response } from 'express';
import type { OrchestratorRequest } from '../../types/internal.js';

/**
 * GET /api/info
 * Orchestrator information
 */
export async function getInfo(req: Request, res: Response): Promise<void> {
  const orchestrator = (req as OrchestratorRequest).orchestrator;
  const config = (orchestrator as any).config;

  res.json({
    version: process.env.npm_package_version || '0.1.0',
    mode: config.mode,
    maxConcurrency: config.maxConcurrency,
    pollIntervalMs: config.pollIntervalMs,
    storageBackends: orchestrator.listStorageBackendIds(),
    defaultStorageBackend: (orchestrator as any).defaultStorageBackend.id,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
}
