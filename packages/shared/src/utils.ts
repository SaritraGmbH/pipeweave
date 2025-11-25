import { createHash, randomBytes } from 'node:crypto';
import { ID_PREFIX } from './constants.js';

// ============================================================================
// ID Generation
// ============================================================================

/**
 * Generate a random ID with a given prefix
 */
export function generateId(prefix: string): string {
  const randomPart = randomBytes(12).toString('base64url');
  return `${prefix}${randomPart}`;
}

export function generatePipelineRunId(): string {
  return generateId(ID_PREFIX.PIPELINE_RUN);
}

export function generateTaskRunId(): string {
  return generateId(ID_PREFIX.TASK_RUN);
}

export function generateDLQItemId(): string {
  return generateId(ID_PREFIX.DLQ_ITEM);
}

// ============================================================================
// Code Hashing
// ============================================================================

/**
 * Generate a code hash from a function's source code
 */
export function generateCodeHash(fn: Function): string {
  const source = fn.toString();
  return createHash('sha256').update(source).digest('hex').substring(0, 16);
}

// ============================================================================
// Retry Delay Calculation
// ============================================================================

export interface RetryDelayOptions {
  attempt: number;
  backoff: 'fixed' | 'exponential';
  baseDelayMs: number;
  maxDelayMs: number;
}

/**
 * Calculate the delay before a retry attempt
 */
export function calculateRetryDelay(options: RetryDelayOptions): number {
  const { attempt, backoff, baseDelayMs, maxDelayMs } = options;

  if (attempt <= 1) {
    return 0; // First attempt has no delay
  }

  let delay: number;
  if (backoff === 'fixed') {
    delay = baseDelayMs;
  } else {
    // Exponential: baseDelay * 2^(attempt-2)
    // attempt 2 = baseDelay * 1
    // attempt 3 = baseDelay * 2
    // attempt 4 = baseDelay * 4
    delay = baseDelayMs * Math.pow(2, attempt - 2);
  }

  return Math.min(delay, maxDelayMs);
}

// ============================================================================
// Idempotency Key
// ============================================================================

/**
 * Generate the final idempotency key by hashing taskId + user key
 */
export function generateIdempotencyKey(taskId: string, userKey: string): string {
  const combined = `${taskId}:${userKey}`;
  return createHash('sha256').update(combined).digest('hex');
}

// ============================================================================
// Date Utilities
// ============================================================================

/**
 * Check if a date is older than a given number of days
 */
export function isOlderThan(date: Date, days: number): boolean {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return date < cutoff;
}

/**
 * Add milliseconds to a date
 */
export function addMs(date: Date, ms: number): Date {
  return new Date(date.getTime() + ms);
}

// ============================================================================
// Object Utilities
// ============================================================================

/**
 * Deep clone an object using JSON serialization
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if a value is a plain object
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}