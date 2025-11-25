import type { TaskContext, TaskLogger, TaskAttempt, AssetType } from '@pipeweave/shared';
import type { HydrationManager } from './hydration.js';

// ============================================================================
// Types
// ============================================================================

export interface CreateTaskContextOptions<TInput = unknown> {
  runId: string;
  pipelineRunId?: string;
  attempt: number;
  codeVersion: number;
  codeHash: string;
  input: TInput;
  upstream: Record<string, unknown>;
  previousAttempts: TaskAttempt[];
  hydration: HydrationManager;
  orchestratorUrl: string;
}

// ============================================================================
// Logger Implementation
// ============================================================================

function createLogger(runId: string, hydration: HydrationManager): TaskLogger {
  const log = (level: string, message: string, meta?: Record<string, unknown>) => {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      runId,
      message,
      ...meta,
    };
    hydration.appendLog(entry);
    
    // Also log to console in development
    const prefix = `[${level.toUpperCase()}] [${runId}]`;
    if (meta) {
      console.log(prefix, message, meta);
    } else {
      console.log(prefix, message);
    }
  };

  return {
    debug: (message, meta) => log('debug', message, meta),
    info: (message, meta) => log('info', message, meta),
    warn: (message, meta) => log('warn', message, meta),
    error: (message, meta) => log('error', message, meta),
  };
}

// ============================================================================
// Context Factory
// ============================================================================

export function createTaskContext<TInput = unknown>(
  options: CreateTaskContextOptions<TInput>
): TaskContext<TInput> {
  const {
    runId,
    pipelineRunId,
    attempt,
    codeVersion,
    codeHash,
    input,
    upstream,
    previousAttempts,
    hydration,
    orchestratorUrl,
  } = options;

  const log = createLogger(runId, hydration);

  const ctx: TaskContext<TInput> = {
    runId,
    pipelineRunId,
    attempt,
    codeVersion,
    codeHash,
    input,
    upstream,
    previousAttempts,
    log,

    async addAsset(key: string, type: AssetType, data: unknown): Promise<string> {
      return hydration.addAsset(key, type, data);
    },

    async addAssetFromPath(key: string, type: AssetType, filePath: string): Promise<string> {
      return hydration.addAssetFromPath(key, type, filePath);
    },

    async getAsset(key: string): Promise<unknown> {
      return hydration.getAsset(key);
    },

    async getAssetPath(key: string): Promise<string> {
      return hydration.getAssetPath(key);
    },

    async progress(percent: number, message?: string): Promise<void> {
      try {
        await fetch(`${orchestratorUrl}/api/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ runId, progress: percent, message }),
        });
      } catch (error) {
        log.warn('Failed to report progress', { error: String(error) });
      }
    },
  };

  return ctx;
}