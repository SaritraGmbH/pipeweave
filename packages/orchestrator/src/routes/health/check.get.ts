import type { Request, Response } from 'express';
import type { OrchestratorRequest } from '../../types/internal.js';

/**
 * GET /health
 * Health check + maintenance status
 */
export async function healthCheck(req: Request, res: Response): Promise<void> {
  try {
    const orchestrator = (req as OrchestratorRequest).orchestrator;
    const db = orchestrator.getDatabase();

    // Test database connection
    const isConnected = await db.one('SELECT 1 as connected');

    // Get maintenance status
    const maintenanceStatus = await orchestrator.getMaintenanceStatus();

    res.json({
      status: 'ok',
      database: isConnected ? 'connected' : 'disconnected',
      maintenance: maintenanceStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}
