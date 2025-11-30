import type { Request, Response } from 'express';
import type { OrchestratorRequest } from '../../types/internal.js';
import { RetryManager } from '../../core/retry-manager.js';
import { DLQManager } from '../../core/dlq-manager.js';
import { IdempotencyManager } from '../../core/idempotency.js';
import { PipelineExecutor } from '../../pipeline/executor.js';
import { TaskCallbackPayloadSchema } from '@pipeweave/shared';
import logger from '../../logger.js';

/**
 * POST /api/task-runs/:runId/complete
 * Task completion callback (success or failure)
 */
export async function completeTaskRun(req: Request, res: Response): Promise<void> {
  const orchestratorReq = req as OrchestratorRequest;
  try {
    const { runId } = req.params;
    if (!runId) {
      res.status(400).json({ error: 'Run ID is required' });
      return;
    }
    const orchestrator = orchestratorReq.orchestrator;
    const db = orchestrator.getDatabase();

    // Validate request
    const parseResult = TaskCallbackPayloadSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Invalid request',
        details: parseResult.error.format(),
      });
      return;
    }

    const payload = parseResult.data;

    // Handle success or failure
    if (payload.status === 'success') {
      // Update task run
      await db.none(
        `UPDATE task_runs
         SET status = 'completed',
             output_path = $2,
             output_size = $3,
             assets = $4,
             logs_path = $5,
             selected_next = $6,
             completed_at = NOW()
         WHERE id = $1`,
        [
          runId,
          payload.outputPath ?? null,
          payload.outputSize ?? null,
          payload.assets ? JSON.stringify(payload.assets) : null,
          payload.logsPath ?? null,
          payload.selectedNext ?? [],
        ]
      );

      logger.info(`[task-runs] Task completed: ${runId}`);

      // Queue downstream tasks (pipeline integration)
      const pipelineExecutor = new PipelineExecutor(db, orchestrator, 'storage');
      const queuedTasks = await pipelineExecutor.queueDownstreamTasks(
        runId,
        payload.selectedNext
      );

      if (queuedTasks.length > 0) {
        logger.info(`[task-runs] Queued ${queuedTasks.length} downstream tasks`);
      }

      // Cache idempotency result if applicable
      const taskRun = await db.oneOrNone<{
        idempotency_key: string | null;
        task_id: string;
        code_version: number;
      }>(
        'SELECT idempotency_key, task_id, code_version FROM task_runs WHERE id = $1',
        [runId]
      );

      if (taskRun?.idempotency_key && payload.outputPath) {
        // Get task definition to get TTL
        const task = await db.oneOrNone<{ idempotency_ttl_seconds: number | null }>(
          'SELECT idempotency_ttl_seconds FROM tasks WHERE id = $1',
          [taskRun.task_id]
        );

        const ttl = task?.idempotency_ttl_seconds ?? 86400; // Default 24 hours

        const idempotencyManager = new IdempotencyManager(db);
        await idempotencyManager.cacheResult(
          taskRun.idempotency_key,
          taskRun.task_id,
          runId,
          taskRun.code_version,
          payload.outputPath,
          ttl,
          payload.outputSize ?? undefined,
          payload.assets ?? undefined
        );
      }

      res.json({
        acknowledged: true,
        queuedDownstream: queuedTasks.length,
      });
    } else {
      // Handle failure
      await db.none(
        `UPDATE task_runs
         SET status = 'failed',
             error = $2,
             error_code = $3,
             logs_path = $4,
             completed_at = NOW()
         WHERE id = $1`,
        [runId, payload.error ?? 'Unknown error', payload.errorCode ?? null, payload.logsPath ?? null]
      );

      logger.warn(`[task-runs] Task failed: ${runId} - ${payload.error}`);

      // Check if we should retry
      const taskRun = await db.oneOrNone<{
        attempt: number;
        max_retries: number;
        task_id: string;
      }>(
        'SELECT attempt, max_retries, task_id FROM task_runs WHERE id = $1',
        [runId]
      );

      if (taskRun) {
        if (taskRun.attempt < taskRun.max_retries) {
          // Get task definition for retry settings
          const task = await db.oneOrNone<{
            retry_backoff: 'fixed' | 'exponential';
            retry_delay_ms: number;
            max_retry_delay_ms: number;
          }>(
            'SELECT retry_backoff, retry_delay_ms, max_retry_delay_ms FROM tasks WHERE id = $1',
            [taskRun.task_id]
          );

          // Schedule retry
          const retryManager = new RetryManager(db);
          await retryManager.scheduleRetry({
            runId,
            taskId: taskRun.task_id,
            attempt: taskRun.attempt,
            maxRetries: taskRun.max_retries,
            retryBackoff: task?.retry_backoff ?? 'exponential',
            retryDelayMs: task?.retry_delay_ms ?? 1000,
            maxRetryDelayMs: task?.max_retry_delay_ms ?? 86400000,
            error: payload.error ?? 'Unknown error',
            errorCode: payload.errorCode,
          });
          logger.info(`[task-runs] Scheduled retry for task run: ${runId}`);
        } else {
          // Get full task run data for DLQ
          const fullTaskRun = await db.oneOrNone(
            'SELECT * FROM task_runs WHERE id = $1',
            [runId]
          );

          if (fullTaskRun) {
            // Move to DLQ
            const dlqManager = new DLQManager(db);
            await dlqManager.add(fullTaskRun, payload.error ?? 'Unknown error');
            logger.info(`[task-runs] Moved to DLQ: ${runId}`);

            // Handle pipeline failure
            const pipelineExecutor = new PipelineExecutor(db, orchestrator, 'storage');
            await pipelineExecutor.handleTaskFailure(runId);
          }
        }
      }

      res.json({
        acknowledged: true,
        retrying: taskRun ? taskRun.attempt < taskRun.max_retries : false,
      });
    }
  } catch (error) {
    logger.error('[task-runs] Failed to process completion callback', { error });
    res.status(500).json({
      error: 'Failed to process callback',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
