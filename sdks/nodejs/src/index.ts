// Worker
export { Worker, createWorker, type WorkerConfig, type TaskHandler } from './worker.js';

// Error
export { TaskError, type TaskErrorOptions } from './error.js';

// Local testing
export { runLocal, type RunLocalOptions } from './local.js';

// Re-export commonly used types from shared
export type {
  TaskContext,
  TaskResult,
  TaskOptions,
  TaskAttempt,
  TaskLogger,
  AssetType,
  AssetMetadata,
} from '@pipeweave/shared';

// Re-export constants
export { DEFAULTS, TaskStatus, PipelineStatus, FailureMode, RetryBackoff } from '@pipeweave/shared';