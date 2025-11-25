import type { TaskContext, TaskAttempt, TaskResult, AssetType, TaskLogger } from '@pipeweave/shared';
import { generateTaskRunId } from '@pipeweave/shared';
import type { Worker } from './worker.js';

// ============================================================================
// Types
// ============================================================================

export interface RunLocalOptions<TInput = unknown> {
  /** Input data for the task */
  input: TInput;
  /** Upstream task outputs */
  upstream?: Record<string, unknown>;
  /** Previous attempt information (for retry testing) */
  previousAttempts?: TaskAttempt[];
  /** Override code version (defaults to 1) */
  codeVersion?: number;
  /** Override code hash */
  codeHash?: string;
}

// ============================================================================
// Local Context
// ============================================================================

function createLocalContext<TInput>(
  runId: string,
  options: RunLocalOptions<TInput>
): TaskContext<TInput> {
  const assets = new Map<string, { type: AssetType; data: unknown }>();
  const upstreamAssets = new Map<string, unknown>();

  const log: TaskLogger = {
    debug: (msg, meta) => console.log(`[DEBUG] ${msg}`, meta ?? ''),
    info: (msg, meta) => console.log(`[INFO] ${msg}`, meta ?? ''),
    warn: (msg, meta) => console.warn(`[WARN] ${msg}`, meta ?? ''),
    error: (msg, meta) => console.error(`[ERROR] ${msg}`, meta ?? ''),
  };

  return {
    runId,
    pipelineRunId: undefined,
    attempt: (options.previousAttempts?.length ?? 0) + 1,
    codeVersion: options.codeVersion ?? 1,
    codeHash: options.codeHash ?? 'local-test',
    input: options.input,
    upstream: options.upstream ?? {},
    previousAttempts: options.previousAttempts ?? [],
    log,

    async addAsset(key: string, type: AssetType, data: unknown): Promise<string> {
      assets.set(key, { type, data });
      return `local://${runId}/assets/${key}`;
    },

    async addAssetFromPath(key: string, type: AssetType, filePath: string): Promise<string> {
      const { readFile } = await import('node:fs/promises');
      const data = await readFile(filePath);
      assets.set(key, { type, data });
      return `local://${runId}/assets/${key}`;
    },

    async getAsset(key: string): Promise<unknown> {
      const local = assets.get(key);
      if (local) {
        return local.data;
      }

      const upstream = upstreamAssets.get(key);
      if (upstream) {
        return upstream;
      }

      throw new Error(`Asset '${key}' not found in local context`);
    },

    async getAssetPath(key: string): Promise<string> {
      throw new Error('getAssetPath is not supported in local mode - use getAsset instead');
    },

    async progress(percent: number, message?: string): Promise<void> {
      console.log(`[PROGRESS] ${percent}%${message ? `: ${message}` : ''}`);
    },
  };
}

// ============================================================================
// Run Local
// ============================================================================

/**
 * Run a task locally for testing and debugging
 * 
 * @example
 * ```typescript
 * const result = await runLocal(worker, 'my-task', {
 *   input: { data: 'test' },
 *   upstream: { 'previous-task': { result: 'mock' } },
 * });
 * ```
 */
export async function runLocal<TInput = unknown, TOutput = unknown>(
  worker: Worker,
  taskId: string,
  options: RunLocalOptions<TInput>
): Promise<TaskResult<TOutput>> {
  // Access private tasks map via getTaskInfo to validate task exists
  const taskInfo = worker.getTaskInfo();
  const task = taskInfo.find((t) => t.id === taskId);
  
  if (!task) {
    throw new Error(`Task '${taskId}' not registered on worker`);
  }

  const runId = generateTaskRunId();
  const ctx = createLocalContext(runId, {
    ...options,
    codeHash: options.codeHash ?? task.codeHash,
  });

  console.log(`[PipeWeave] Running task '${taskId}' locally (${runId})`);
  console.log(`[PipeWeave] Code version: ${ctx.codeVersion}, hash: ${ctx.codeHash}`);

  // Get the actual handler (we need to access it through the worker)
  // For now, this requires the worker to expose a method to get the handler
  // This is a simplified implementation
  const handler = (worker as any).tasks.get(taskId)?.handler;
  
  if (!handler) {
    throw new Error(`Handler for task '${taskId}' not found`);
  }

  try {
    const result = await handler(ctx);
    
    // Normalize result
    const normalizedResult: TaskResult<TOutput> =
      result && typeof result === 'object' && 'output' in result
        ? (result as TaskResult<TOutput>)
        : { output: result as TOutput };

    console.log(`[PipeWeave] Task '${taskId}' completed successfully`);
    
    return normalizedResult;
  } catch (error) {
    console.error(`[PipeWeave] Task '${taskId}' failed:`, error);
    throw error;
  }
}