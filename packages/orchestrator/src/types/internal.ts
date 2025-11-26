import type { Request, Response, NextFunction } from 'express';
import type { Orchestrator } from '../orchestrator.js';

// ============================================================================
// Express Extensions
// ============================================================================

export interface OrchestratorRequest extends Request {
  orchestrator: Orchestrator;
}

export type RouteHandler = (req: OrchestratorRequest, res: Response, next: NextFunction) => Promise<void> | void;

// ============================================================================
// Queue Items
// ============================================================================

export interface QueueItem {
  runId: string;
  taskId: string;
  pipelineRunId?: string;
  priority: number;
  status: 'pending' | 'running' | 'waiting' | 'completed' | 'failed' | 'cancelled' | 'timeout';
  attempt: number;
  maxRetries: number;
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  errorCode?: string;
}

// ============================================================================
// Storage JWT Payload
// ============================================================================

export interface StorageJWTPayload {
  id: string;
  provider: 'local' | 'aws-s3' | 'gcs' | 'minio';
  endpoint: string;
  bucket: string;
  region?: string;
  credentials: Record<string, any>;
  /** Issued at (unix timestamp) */
  iat: number;
  /** Expires at (unix timestamp) - optional, for short-lived tokens */
  exp?: number;
}

// ============================================================================
// Task Dispatch Context
// ============================================================================

export interface TaskDispatchContext {
  runId: string;
  taskId: string;
  pipelineRunId?: string;
  attempt: number;
  codeVersion: number;
  codeHash: string;
  inputPath: string;
  upstreamRefs: Record<string, {
    outputPath: string;
    assets?: Record<string, {
      path: string;
      size: number;
      type: string;
    }>;
  }>;
  previousAttempts: Array<{
    attempt: number;
    error: string;
    errorCode?: string;
    timestamp: Date;
  }>;
  heartbeatIntervalMs: number;
}

// ============================================================================
// Heartbeat Tracking
// ============================================================================

export interface HeartbeatTracker {
  runId: string;
  taskId: string;
  startedAt: Date;
  lastHeartbeat: Date;
  timeoutMs: number;
  timeoutHandle?: NodeJS.Timeout;
}

// ============================================================================
// Service Registry
// ============================================================================

export interface RegisteredService {
  serviceId: string;
  version: string;
  baseUrl: string;
  registeredAt: Date;
  lastSeenAt: Date;
  tasks: RegisteredTask[];
}

export interface RegisteredTask {
  taskId: string;
  codeHash: string;
  codeVersion: number;
  heartbeatIntervalMs: number;
  timeout: number;
  retries: number;
  retryBackoff: 'fixed' | 'exponential';
  retryDelayMs: number;
  maxRetryDelayMs: number;
  concurrency: number;
  priority: number;
  allowedNext: string[];
  description?: string;
}

// ============================================================================
// Pipeline Graph
// ============================================================================

export interface PipelineNode {
  taskId: string;
  allowedNext: string[];
  predecessors: string[];
  level: number; // Topological level
}

export interface PipelineGraph {
  nodes: Map<string, PipelineNode>;
  entryNodes: string[];
  endNodes: string[];
}

// ============================================================================
// Retry Strategy
// ============================================================================

export interface RetryStrategy {
  attempt: number;
  maxRetries: number;
  retryBackoff: 'fixed' | 'exponential';
  retryDelayMs: number;
  maxRetryDelayMs: number;
}

export interface RetryDecision {
  shouldRetry: boolean;
  delayMs: number;
  reason?: string;
}
