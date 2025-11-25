// ============================================================================
// Task Error
// ============================================================================

export interface TaskErrorOptions {
  /** Error code for categorization */
  code?: string;
  /** Whether this error should be retried (default: true) */
  retryable?: boolean;
  /** Additional error details */
  details?: Record<string, unknown>;
  /** Original error cause */
  cause?: Error;
}

/**
 * Custom error class for task failures with retry control
 */
export class TaskError extends Error {
  readonly code?: string;
  readonly retryable: boolean;
  readonly details?: Record<string, unknown>;

  constructor(message: string, options: TaskErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = 'TaskError';
    this.code = options.code;
    this.retryable = options.retryable ?? true;
    this.details = options.details;
  }

  /**
   * Create a non-retryable error
   */
  static nonRetryable(message: string, code?: string): TaskError {
    return new TaskError(message, { code, retryable: false });
  }

  /**
   * Create a retryable error with a specific code
   */
  static retryable(message: string, code?: string): TaskError {
    return new TaskError(message, { code, retryable: true });
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      retryable: this.retryable,
      details: this.details,
    };
  }
}