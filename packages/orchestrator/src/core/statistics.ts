import TDigest from 'tdigest';
import type { Database } from '../db/index.js';
import logger from '../logger.js';

// ============================================================================
// Types
// ============================================================================

export type StatisticsScope = 'system' | 'service' | 'task' | 'pipeline';
export type BucketSize = '1m' | '1h' | '1d';

export interface StatisticsOptions {
  scope: StatisticsScope;
  scopeId?: string;
  from: Date;
  to: Date;
  bucket?: BucketSize;
}

export interface PercentileStats {
  count: number;
  min?: number;
  max?: number;
  avg?: number;
  median?: number; // p50
  p50?: number;
  p95?: number;
  p99?: number;
}

export interface StatisticsBucket {
  timestamp: Date;
  taskRuns: {
    count: number;
    byStatus: {
      completed: number;
      failed: number;
      timeout: number;
      cancelled: number;
      pending: number;
      running: number;
    };
    runtime: PercentileStats;
    waitTime: PercentileStats;
    retries: {
      total: number;
      successful: number;
    };
  };
  pipelineRuns: {
    count: number;
    byStatus: {
      completed: number;
      failed: number;
      cancelled: number;
      partial: number;
    };
    runtime: PercentileStats;
  };
  queue: {
    pending: number;
    running: number;
    waiting: number;
  };
  errors: {
    total: number;
    byCode: Record<string, number>;
  };
  dlq: {
    added: number;
    retried: number;
  };
}

export interface StatisticsResponse {
  buckets: StatisticsBucket[];
  summary: {
    totalTaskRuns: number;
    totalPipelineRuns: number;
    avgSuccessRate: number;
    avgRuntime: number;
    avgWaitTime: number;
  };
}

// ============================================================================
// Statistics Service
// ============================================================================

export class StatisticsService {
  constructor(private db: Database) {}

  /**
   * Get statistics for a time range
   * - Checks database for pre-built buckets
   * - Builds missing buckets on-demand
   * - Rebuilds current bucket if stale (>60s)
   */
  async getStatistics(options: StatisticsOptions): Promise<StatisticsResponse> {
    const bucketSize = options.bucket || '1m';
    const buckets = this.generateBucketTimestamps(options.from, options.to, bucketSize);
    const results: StatisticsBucket[] = [];

    for (const bucketTime of buckets) {
      let stats = await this.getStoredBucket(bucketTime, options.scope, options.scopeId);

      const isCurrentBucket = this.isCurrentBucket(bucketTime, bucketSize);
      const needsRebuild =
        !stats || (isCurrentBucket && this.isStale(stats.last_built_at, 60));

      if (needsRebuild) {
        stats = await this.buildBucket(bucketTime, bucketSize, options.scope, options.scopeId);
        await this.storeBucket(stats, bucketTime, options.scope, options.scopeId, !isCurrentBucket);
      }

      results.push(this.mapToStatisticsBucket(stats, bucketTime));
    }

    return {
      buckets: results,
      summary: this.calculateSummary(results),
    };
  }

  /**
   * Get real-time queue statistics
   */
  async getQueueStatistics(): Promise<{
    depth: {
      pending: number;
      running: number;
      waiting: number;
    };
    byTask: Array<{
      taskId: string;
      taskName: string;
      pending: number;
      running: number;
      oldestWaitMs: number | null;
    }>;
    oldestPending: {
      runId: string;
      taskId: string;
      waitMs: number;
    } | null;
    avgWaitMs: number | null;
  }> {
    // Get overall queue depth
    const depth = await this.db.oneOrNone<{
      pending: string;
      running: string;
      waiting: string;
    }>(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'pending') as pending,
         COUNT(*) FILTER (WHERE status = 'running') as running,
         COUNT(*) FILTER (WHERE status = 'waiting') as waiting
       FROM task_runs`
    );

    // Get per-task breakdown
    const byTask = await this.db.manyOrNone<any>(
      `SELECT
         tr.task_id,
         t.id as task_name,
         COUNT(*) FILTER (WHERE tr.status = 'pending') as pending,
         COUNT(*) FILTER (WHERE tr.status = 'running') as running,
         MIN(EXTRACT(EPOCH FROM (NOW() - tr.created_at)) * 1000)
           FILTER (WHERE tr.status = 'pending') as oldest_wait_ms
       FROM task_runs tr
       JOIN tasks t ON tr.task_id = t.id
       WHERE tr.status IN ('pending', 'running')
       GROUP BY tr.task_id, t.id
       ORDER BY pending DESC`
    );

    // Get oldest pending task
    const oldestPending = await this.db.oneOrNone<{
      id: string;
      task_id: string;
      created_at: Date;
    }>(
      `SELECT id, task_id, created_at
       FROM task_runs
       WHERE status = 'pending'
       ORDER BY created_at ASC
       LIMIT 1`
    );

    // Get average wait time for recently started tasks
    const avgWait = await this.db.oneOrNone<{ avg_wait_ms: number }>(
      `SELECT AVG(EXTRACT(EPOCH FROM (started_at - created_at)) * 1000) as avg_wait_ms
       FROM task_runs
       WHERE started_at IS NOT NULL
         AND started_at > NOW() - INTERVAL '1 hour'`
    );

    return {
      depth: {
        pending: parseInt(depth?.pending || '0', 10),
        running: parseInt(depth?.running || '0', 10),
        waiting: parseInt(depth?.waiting || '0', 10),
      },
      byTask: byTask.map((t) => ({
        taskId: t.task_id,
        taskName: t.task_name,
        pending: parseInt(t.pending || '0', 10),
        running: parseInt(t.running || '0', 10),
        oldestWaitMs: t.oldest_wait_ms ? parseFloat(t.oldest_wait_ms) : null,
      })),
      oldestPending: oldestPending
        ? {
            runId: oldestPending.id,
            taskId: oldestPending.task_id,
            waitMs: Date.now() - oldestPending.created_at.getTime(),
          }
        : null,
      avgWaitMs: avgWait?.avg_wait_ms || null,
    };
  }

  /**
   * Build statistics for a single bucket from raw data
   */
  private async buildBucket(
    bucketTime: Date,
    bucketSize: BucketSize,
    scope: StatisticsScope,
    scopeId?: string
  ): Promise<any> {
    const bucketEnd = this.getBucketEnd(bucketTime, bucketSize);

    // Build task run statistics
    const taskStats = await this.buildTaskStats(bucketTime, bucketEnd, scope, scopeId);

    // Build pipeline run statistics
    const pipelineStats = await this.buildPipelineStats(bucketTime, bucketEnd, scope, scopeId);

    // Get queue depth at end of bucket
    const queueDepth = await this.getQueueDepthAt(bucketEnd);

    // Get DLQ statistics
    const dlqStats = await this.getDLQStats(bucketTime, bucketEnd, scope, scopeId);

    return {
      ...taskStats,
      ...pipelineStats,
      ...queueDepth,
      ...dlqStats,
    };
  }

  /**
   * Build task run statistics with T-Digest for percentiles
   */
  private async buildTaskStats(
    bucketStart: Date,
    bucketEnd: Date,
    scope: StatisticsScope,
    scopeId?: string
  ) {
    const scopeFilter = this.buildScopeFilter(scope, scopeId, 'tr');

    const taskRuns = await this.db.manyOrNone<{
      status: string;
      error_code: string | null;
      runtime_ms: number | null;
      wait_ms: number | null;
      attempt: number;
    }>(
      `SELECT
         status,
         error_code,
         EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000 as runtime_ms,
         EXTRACT(EPOCH FROM (started_at - created_at)) * 1000 as wait_ms,
         attempt
       FROM task_runs tr
       WHERE created_at >= $1 AND created_at < $2
         ${scopeFilter}`,
      [bucketStart, bucketEnd, scopeId].filter(Boolean)
    );

    // Count by status
    const statusCounts = {
      task_completed: 0,
      task_failed: 0,
      task_timeout: 0,
      task_cancelled: 0,
      task_pending: 0,
      task_running: 0,
    };

    const errorsByCode: Record<string, number> = {};
    const runtimeValues: number[] = [];
    const waitTimeValues: number[] = [];
    let retryCount = 0;
    let retrySuccessCount = 0;

    for (const run of taskRuns) {
      // Count by status
      if (run.status === 'completed') statusCounts.task_completed++;
      else if (run.status === 'failed') statusCounts.task_failed++;
      else if (run.status === 'timeout') statusCounts.task_timeout++;
      else if (run.status === 'cancelled') statusCounts.task_cancelled++;
      else if (run.status === 'pending') statusCounts.task_pending++;
      else if (run.status === 'running') statusCounts.task_running++;

      // Count errors by code
      if (run.error_code) {
        errorsByCode[run.error_code] = (errorsByCode[run.error_code] || 0) + 1;
      }

      // Collect runtime values
      if (run.runtime_ms !== null && run.runtime_ms >= 0) {
        runtimeValues.push(run.runtime_ms);
      }

      // Collect wait time values
      if (run.wait_ms !== null && run.wait_ms >= 0) {
        waitTimeValues.push(run.wait_ms);
      }

      // Count retries
      if (run.attempt > 1) {
        retryCount++;
        if (run.status === 'completed') {
          retrySuccessCount++;
        }
      }
    }

    return {
      task_run_count: taskRuns.length,
      ...statusCounts,
      task_runtime_count: runtimeValues.length,
      task_runtime_sum_ms: runtimeValues.reduce((sum, val) => sum + val, 0),
      task_runtime_min_ms: runtimeValues.length > 0 ? Math.min(...runtimeValues) : null,
      task_runtime_max_ms: runtimeValues.length > 0 ? Math.max(...runtimeValues) : null,
      task_runtime_tdigest: this.buildTDigest(runtimeValues),
      wait_time_count: waitTimeValues.length,
      wait_time_sum_ms: waitTimeValues.reduce((sum, val) => sum + val, 0),
      wait_time_min_ms: waitTimeValues.length > 0 ? Math.min(...waitTimeValues) : null,
      wait_time_max_ms: waitTimeValues.length > 0 ? Math.max(...waitTimeValues) : null,
      wait_time_tdigest: this.buildTDigest(waitTimeValues),
      errors_by_code: errorsByCode,
      retry_count: retryCount,
      retry_success_count: retrySuccessCount,
    };
  }

  /**
   * Build pipeline run statistics with T-Digest for percentiles
   */
  private async buildPipelineStats(
    bucketStart: Date,
    bucketEnd: Date,
    scope: StatisticsScope,
    scopeId?: string
  ) {
    const scopeFilter = this.buildScopeFilter(scope, scopeId, 'pr');

    const pipelineRuns = await this.db.manyOrNone<{
      status: string;
      runtime_ms: number | null;
    }>(
      `SELECT
         status,
         EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000 as runtime_ms
       FROM pipeline_runs pr
       WHERE created_at >= $1 AND created_at < $2
         ${scopeFilter}`,
      [bucketStart, bucketEnd, scopeId].filter(Boolean)
    );

    // Count by status
    const statusCounts = {
      pipeline_completed: 0,
      pipeline_failed: 0,
      pipeline_cancelled: 0,
      pipeline_partial: 0,
    };

    const runtimeValues: number[] = [];

    for (const run of pipelineRuns) {
      if (run.status === 'completed') statusCounts.pipeline_completed++;
      else if (run.status === 'failed') statusCounts.pipeline_failed++;
      else if (run.status === 'cancelled') statusCounts.pipeline_cancelled++;
      else if (run.status === 'partial') statusCounts.pipeline_partial++;

      if (run.runtime_ms !== null && run.runtime_ms >= 0) {
        runtimeValues.push(run.runtime_ms);
      }
    }

    return {
      pipeline_run_count: pipelineRuns.length,
      ...statusCounts,
      pipeline_runtime_count: runtimeValues.length,
      pipeline_runtime_sum_ms: runtimeValues.reduce((sum, val) => sum + val, 0),
      pipeline_runtime_min_ms: runtimeValues.length > 0 ? Math.min(...runtimeValues) : null,
      pipeline_runtime_max_ms: runtimeValues.length > 0 ? Math.max(...runtimeValues) : null,
      pipeline_runtime_tdigest: this.buildTDigest(runtimeValues),
    };
  }

  /**
   * Get queue depth at a specific timestamp
   */
  private async getQueueDepthAt(timestamp: Date) {
    const depth = await this.db.oneOrNone<{
      pending: string;
      running: string;
      waiting: string;
    }>(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'pending') as pending,
         COUNT(*) FILTER (WHERE status = 'running') as running,
         COUNT(*) FILTER (WHERE status = 'waiting') as waiting
       FROM task_runs
       WHERE created_at <= $1
         AND (completed_at IS NULL OR completed_at > $1)`,
      [timestamp]
    );

    return {
      queue_depth_pending: depth ? parseInt(depth.pending, 10) : 0,
      queue_depth_running: depth ? parseInt(depth.running, 10) : 0,
      queue_depth_waiting: depth ? parseInt(depth.waiting, 10) : 0,
    };
  }

  /**
   * Get DLQ statistics for a time range
   */
  private async getDLQStats(
    bucketStart: Date,
    bucketEnd: Date,
    scope: StatisticsScope,
    scopeId?: string
  ) {
    const scopeFilter = scope === 'task' ? 'AND task_id = $3' : scope === 'pipeline' ? 'AND pipeline_run_id = $3' : '';

    const dlqStats = await this.db.oneOrNone<{
      added: string;
      retried: string;
    }>(
      `SELECT
         COUNT(*) FILTER (WHERE failed_at >= $1 AND failed_at < $2) as added,
         COUNT(*) FILTER (WHERE retried_at >= $1 AND retried_at < $2) as retried
       FROM dlq
       WHERE failed_at >= $1 AND failed_at < $2
         ${scopeFilter}`,
      [bucketStart, bucketEnd, scopeId].filter(Boolean)
    );

    return {
      dlq_added_count: dlqStats ? parseInt(dlqStats.added, 10) : 0,
      dlq_retried_count: dlqStats ? parseInt(dlqStats.retried, 10) : 0,
    };
  }

  /**
   * Build T-Digest from values for percentile calculation
   */
  private buildTDigest(values: number[]): any | null {
    if (values.length === 0) return null;

    const digest = new TDigest();
    for (const value of values) {
      digest.push(value);
    }

    // Serialize digest state
    return digest.toArray();
  }

  /**
   * Calculate percentiles from T-Digest
   */
  private calculatePercentilesFromTDigest(tdigestData: any, count: number, sum: number, min?: number, max?: number): PercentileStats {
    if (!tdigestData || count === 0) {
      return { count: 0 };
    }

    const digest = new TDigest();
    digest.push(tdigestData);

    const p50 = digest.percentile(0.5);

    return {
      count,
      min,
      max,
      avg: sum / count,
      median: p50, // median is same as p50
      p50,
      p95: digest.percentile(0.95),
      p99: digest.percentile(0.99),
    };
  }

  /**
   * Build scope filter for SQL queries
   */
  private buildScopeFilter(scope: StatisticsScope, scopeId: string | undefined, alias: string): string {
    if (scope === 'service' && scopeId) {
      return `AND ${alias}.task_id IN (SELECT id FROM tasks WHERE service_id = $3)`;
    } else if (scope === 'task' && scopeId) {
      return `AND ${alias}.task_id = $3`;
    } else if (scope === 'pipeline' && scopeId) {
      return `AND ${alias}.pipeline_run_id IN (SELECT id FROM pipeline_runs WHERE pipeline_id = $3)`;
    }
    return '';
  }

  /**
   * Get stored bucket from database
   */
  private async getStoredBucket(
    bucketTime: Date,
    scope: StatisticsScope,
    scopeId?: string
  ): Promise<any | null> {
    return await this.db.oneOrNone(
      `SELECT * FROM statistics_timeseries
       WHERE bucket_timestamp = $1
         AND scope = $2
         AND (scope_id = $3 OR ($3 IS NULL AND scope_id IS NULL))`,
      [bucketTime, scope, scopeId || null]
    );
  }

  /**
   * Store bucket in database
   */
  private async storeBucket(
    stats: any,
    bucketTime: Date,
    scope: StatisticsScope,
    scopeId: string | undefined,
    isComplete: boolean
  ): Promise<void> {
    await this.db.none(
      `INSERT INTO statistics_timeseries (
         bucket_timestamp, scope, scope_id,
         task_run_count, task_completed, task_failed, task_timeout, task_cancelled,
         task_pending, task_running,
         pipeline_run_count, pipeline_completed, pipeline_failed, pipeline_cancelled, pipeline_partial,
         task_runtime_count, task_runtime_sum_ms, task_runtime_min_ms, task_runtime_max_ms, task_runtime_tdigest,
         wait_time_count, wait_time_sum_ms, wait_time_min_ms, wait_time_max_ms, wait_time_tdigest,
         pipeline_runtime_count, pipeline_runtime_sum_ms, pipeline_runtime_min_ms, pipeline_runtime_max_ms, pipeline_runtime_tdigest,
         queue_depth_pending, queue_depth_running, queue_depth_waiting,
         errors_by_code, retry_count, retry_success_count,
         dlq_added_count, dlq_retried_count,
         is_complete, last_built_at
       )
       VALUES (
         $1, $2, $3,
         $4, $5, $6, $7, $8, $9, $10,
         $11, $12, $13, $14, $15,
         $16, $17, $18, $19, $20,
         $21, $22, $23, $24, $25,
         $26, $27, $28, $29, $30,
         $31, $32, $33,
         $34, $35, $36,
         $37, $38,
         $39, NOW()
       )
       ON CONFLICT (bucket_timestamp, scope, scope_id)
       DO UPDATE SET
         task_run_count = EXCLUDED.task_run_count,
         task_completed = EXCLUDED.task_completed,
         task_failed = EXCLUDED.task_failed,
         task_timeout = EXCLUDED.task_timeout,
         task_cancelled = EXCLUDED.task_cancelled,
         task_pending = EXCLUDED.task_pending,
         task_running = EXCLUDED.task_running,
         pipeline_run_count = EXCLUDED.pipeline_run_count,
         pipeline_completed = EXCLUDED.pipeline_completed,
         pipeline_failed = EXCLUDED.pipeline_failed,
         pipeline_cancelled = EXCLUDED.pipeline_cancelled,
         pipeline_partial = EXCLUDED.pipeline_partial,
         task_runtime_count = EXCLUDED.task_runtime_count,
         task_runtime_sum_ms = EXCLUDED.task_runtime_sum_ms,
         task_runtime_min_ms = EXCLUDED.task_runtime_min_ms,
         task_runtime_max_ms = EXCLUDED.task_runtime_max_ms,
         task_runtime_tdigest = EXCLUDED.task_runtime_tdigest,
         wait_time_count = EXCLUDED.wait_time_count,
         wait_time_sum_ms = EXCLUDED.wait_time_sum_ms,
         wait_time_min_ms = EXCLUDED.wait_time_min_ms,
         wait_time_max_ms = EXCLUDED.wait_time_max_ms,
         wait_time_tdigest = EXCLUDED.wait_time_tdigest,
         pipeline_runtime_count = EXCLUDED.pipeline_runtime_count,
         pipeline_runtime_sum_ms = EXCLUDED.pipeline_runtime_sum_ms,
         pipeline_runtime_min_ms = EXCLUDED.pipeline_runtime_min_ms,
         pipeline_runtime_max_ms = EXCLUDED.pipeline_runtime_max_ms,
         pipeline_runtime_tdigest = EXCLUDED.pipeline_runtime_tdigest,
         queue_depth_pending = EXCLUDED.queue_depth_pending,
         queue_depth_running = EXCLUDED.queue_depth_running,
         queue_depth_waiting = EXCLUDED.queue_depth_waiting,
         errors_by_code = EXCLUDED.errors_by_code,
         retry_count = EXCLUDED.retry_count,
         retry_success_count = EXCLUDED.retry_success_count,
         dlq_added_count = EXCLUDED.dlq_added_count,
         dlq_retried_count = EXCLUDED.dlq_retried_count,
         is_complete = EXCLUDED.is_complete,
         last_built_at = NOW()`,
      [
        bucketTime,
        scope,
        scopeId || null,
        stats.task_run_count || 0,
        stats.task_completed || 0,
        stats.task_failed || 0,
        stats.task_timeout || 0,
        stats.task_cancelled || 0,
        stats.task_pending || 0,
        stats.task_running || 0,
        stats.pipeline_run_count || 0,
        stats.pipeline_completed || 0,
        stats.pipeline_failed || 0,
        stats.pipeline_cancelled || 0,
        stats.pipeline_partial || 0,
        stats.task_runtime_count || 0,
        stats.task_runtime_sum_ms || 0,
        stats.task_runtime_min_ms || null,
        stats.task_runtime_max_ms || null,
        stats.task_runtime_tdigest ? JSON.stringify(stats.task_runtime_tdigest) : null,
        stats.wait_time_count || 0,
        stats.wait_time_sum_ms || 0,
        stats.wait_time_min_ms || null,
        stats.wait_time_max_ms || null,
        stats.wait_time_tdigest ? JSON.stringify(stats.wait_time_tdigest) : null,
        stats.pipeline_runtime_count || 0,
        stats.pipeline_runtime_sum_ms || 0,
        stats.pipeline_runtime_min_ms || null,
        stats.pipeline_runtime_max_ms || null,
        stats.pipeline_runtime_tdigest ? JSON.stringify(stats.pipeline_runtime_tdigest) : null,
        stats.queue_depth_pending || 0,
        stats.queue_depth_running || 0,
        stats.queue_depth_waiting || 0,
        JSON.stringify(stats.errors_by_code || {}),
        stats.retry_count || 0,
        stats.retry_success_count || 0,
        stats.dlq_added_count || 0,
        stats.dlq_retried_count || 0,
        isComplete,
      ]
    );

    logger.debug(`[statistics] Stored bucket: ${bucketTime.toISOString()} (scope: ${scope}, complete: ${isComplete})`);
  }

  /**
   * Map database row to StatisticsBucket
   */
  private mapToStatisticsBucket(stats: any, bucketTime: Date): StatisticsBucket {
    return {
      timestamp: bucketTime,
      taskRuns: {
        count: stats.task_run_count || 0,
        byStatus: {
          completed: stats.task_completed || 0,
          failed: stats.task_failed || 0,
          timeout: stats.task_timeout || 0,
          cancelled: stats.task_cancelled || 0,
          pending: stats.task_pending || 0,
          running: stats.task_running || 0,
        },
        runtime: this.calculatePercentilesFromTDigest(
          stats.task_runtime_tdigest,
          stats.task_runtime_count || 0,
          stats.task_runtime_sum_ms || 0,
          stats.task_runtime_min_ms,
          stats.task_runtime_max_ms
        ),
        waitTime: this.calculatePercentilesFromTDigest(
          stats.wait_time_tdigest,
          stats.wait_time_count || 0,
          stats.wait_time_sum_ms || 0,
          stats.wait_time_min_ms,
          stats.wait_time_max_ms
        ),
        retries: {
          total: stats.retry_count || 0,
          successful: stats.retry_success_count || 0,
        },
      },
      pipelineRuns: {
        count: stats.pipeline_run_count || 0,
        byStatus: {
          completed: stats.pipeline_completed || 0,
          failed: stats.pipeline_failed || 0,
          cancelled: stats.pipeline_cancelled || 0,
          partial: stats.pipeline_partial || 0,
        },
        runtime: this.calculatePercentilesFromTDigest(
          stats.pipeline_runtime_tdigest,
          stats.pipeline_runtime_count || 0,
          stats.pipeline_runtime_sum_ms || 0,
          stats.pipeline_runtime_min_ms,
          stats.pipeline_runtime_max_ms
        ),
      },
      queue: {
        pending: stats.queue_depth_pending || 0,
        running: stats.queue_depth_running || 0,
        waiting: stats.queue_depth_waiting || 0,
      },
      errors: {
        total: stats.task_failed + stats.task_timeout || 0,
        byCode: stats.errors_by_code || {},
      },
      dlq: {
        added: stats.dlq_added_count || 0,
        retried: stats.dlq_retried_count || 0,
      },
    };
  }

  /**
   * Calculate summary statistics across all buckets
   */
  private calculateSummary(buckets: StatisticsBucket[]) {
    let totalTaskRuns = 0;
    let totalPipelineRuns = 0;
    let totalCompleted = 0;
    let totalRuntimeMs = 0;
    let totalRuntimeCount = 0;
    let totalWaitMs = 0;
    let totalWaitCount = 0;

    for (const bucket of buckets) {
      totalTaskRuns += bucket.taskRuns.count;
      totalPipelineRuns += bucket.pipelineRuns.count;
      totalCompleted += bucket.taskRuns.byStatus.completed;

      if (bucket.taskRuns.runtime.avg) {
        totalRuntimeMs += bucket.taskRuns.runtime.avg * bucket.taskRuns.runtime.count;
        totalRuntimeCount += bucket.taskRuns.runtime.count;
      }

      if (bucket.taskRuns.waitTime.avg) {
        totalWaitMs += bucket.taskRuns.waitTime.avg * bucket.taskRuns.waitTime.count;
        totalWaitCount += bucket.taskRuns.waitTime.count;
      }
    }

    return {
      totalTaskRuns,
      totalPipelineRuns,
      avgSuccessRate: totalTaskRuns > 0 ? totalCompleted / totalTaskRuns : 0,
      avgRuntime: totalRuntimeCount > 0 ? totalRuntimeMs / totalRuntimeCount : 0,
      avgWaitTime: totalWaitCount > 0 ? totalWaitMs / totalWaitCount : 0,
    };
  }

  /**
   * Generate bucket timestamps for a time range
   */
  private generateBucketTimestamps(from: Date, to: Date, bucketSize: BucketSize): Date[] {
    const buckets: Date[] = [];
    const current = this.alignToBucket(from, bucketSize);
    const end = this.alignToBucket(to, bucketSize);

    while (current <= end) {
      buckets.push(new Date(current));
      current.setTime(current.getTime() + this.getBucketSizeMs(bucketSize));
    }

    return buckets;
  }

  /**
   * Align timestamp to bucket boundary
   */
  private alignToBucket(date: Date, bucketSize: BucketSize): Date {
    const aligned = new Date(date);
    if (bucketSize === '1m') {
      aligned.setSeconds(0, 0);
    } else if (bucketSize === '1h') {
      aligned.setMinutes(0, 0, 0);
    } else if (bucketSize === '1d') {
      aligned.setHours(0, 0, 0, 0);
    }
    return aligned;
  }

  /**
   * Get bucket size in milliseconds
   */
  private getBucketSizeMs(bucketSize: BucketSize): number {
    if (bucketSize === '1m') return 60 * 1000;
    if (bucketSize === '1h') return 60 * 60 * 1000;
    if (bucketSize === '1d') return 24 * 60 * 60 * 1000;
    return 60 * 1000;
  }

  /**
   * Get end timestamp for a bucket
   */
  private getBucketEnd(bucketStart: Date, bucketSize: BucketSize): Date {
    return new Date(bucketStart.getTime() + this.getBucketSizeMs(bucketSize));
  }

  /**
   * Check if bucket is the current (incomplete) bucket
   */
  private isCurrentBucket(bucketTime: Date, bucketSize: BucketSize): boolean {
    const now = new Date();
    const currentBucket = this.alignToBucket(now, bucketSize);
    return bucketTime.getTime() === currentBucket.getTime();
  }

  /**
   * Check if timestamp is stale (older than threshold in seconds)
   */
  private isStale(timestamp: Date, thresholdSeconds: number): boolean {
    const now = new Date();
    const diff = (now.getTime() - timestamp.getTime()) / 1000;
    return diff > thresholdSeconds;
  }
}
