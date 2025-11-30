import type { Request, Response, NextFunction } from 'express';
import type { Orchestrator } from '../../orchestrator.js';
import type { OrchestratorRequest } from '../../types/internal.js';

/**
 * Middleware to attach orchestrator instance to all requests
 */
export function attachOrchestrator(orchestrator: Orchestrator) {
  return (req: Request, _res: Response, next: NextFunction) => {
    (req as OrchestratorRequest).orchestrator = orchestrator;
    next();
  };
}
