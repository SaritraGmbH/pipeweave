import { z } from 'zod';
import {
  TaskRegistrationInfoSchema,
  CodeChangeInfoSchema,
  TaskRunSchema,
  PipelineRunSchema,
} from './pipeline.js';
import { AssetMetadataSchema, FailureModeSchema } from './task.js';

// ============================================================================
// Service Registration
// ============================================================================

export const RegisterServiceRequestSchema = z.object({
  serviceId: z.string(),
  version: z.string(),
  baseUrl: z.string().url(),
  tasks: z.array(TaskRegistrationInfoSchema),
});

export type RegisterServiceRequest = z.infer<typeof RegisterServiceRequestSchema>;

export const RegisterServiceResponseSchema = z.object({
  success: z.boolean(),
  codeChanges: z.array(CodeChangeInfoSchema),
  orphanedTasks: z.array(z.string()).optional(),
});

export type RegisterServiceResponse = z.infer<typeof RegisterServiceResponseSchema>;

// ============================================================================
// Pipeline Trigger
// ============================================================================

export const TriggerPipelineRequestSchema = z.object({
  input: z.unknown(),
  failureMode: FailureModeSchema.optional(),
  priority: z.number().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type TriggerPipelineRequest = z.infer<typeof TriggerPipelineRequestSchema>;

export const TriggerPipelineResponseSchema = z.object({
  pipelineRunId: z.string(),
  status: z.string(),
});

export type TriggerPipelineResponse = z.infer<typeof TriggerPipelineResponseSchema>;

// ============================================================================
// Queue Task
// ============================================================================

export const QueueTaskRequestSchema = z.object({
  taskId: z.string(),
  input: z.unknown(),
  priority: z.number().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type QueueTaskRequest = z.infer<typeof QueueTaskRequestSchema>;

export const QueueTaskResponseSchema = z.object({
  runId: z.string(),
  status: z.string(),
  taskId: z.string(),
  inputPath: z.string(),
});

export type QueueTaskResponse = z.infer<typeof QueueTaskResponseSchema>;

// ============================================================================
// Queue Batch
// ============================================================================

export const QueueBatchRequestSchema = z.object({
  tasks: z.array(QueueTaskRequestSchema),
});

export type QueueBatchRequest = z.infer<typeof QueueBatchRequestSchema>;

export const QueueBatchResponseSchema = z.object({
  queued: z.number(),
  results: z.array(QueueTaskResponseSchema),
});

export type QueueBatchResponse = z.infer<typeof QueueBatchResponseSchema>;

// ============================================================================
// Queue Status
// ============================================================================

export const QueueStatusResponseSchema = z.object({
  pending: z.number(),
  running: z.number(),
  waiting: z.number(),
  completed: z.number(),
  failed: z.number(),
  dlq: z.number(),
  oldestPending: z.coerce.date().nullable(),
});

export type QueueStatusResponse = z.infer<typeof QueueStatusResponseSchema>;

// ============================================================================
// Task Dispatch (Orchestrator -> Worker)
// ============================================================================

export const TaskDispatchPayloadSchema = z.object({
  runId: z.string(),
  taskId: z.string(),
  pipelineRunId: z.string().optional(),
  attempt: z.number().positive(),
  codeVersion: z.number().positive(),
  codeHash: z.string(),
  storageToken: z.string(), // JWT with S3 credentials
  inputPath: z.string(),
  upstreamRefs: z.record(
    z.object({
      outputPath: z.string(),
      assets: z.record(AssetMetadataSchema).optional(),
    })
  ),
  previousAttempts: z.array(
    z.object({
      attempt: z.number().positive(),
      error: z.string(),
      errorCode: z.string().optional(),
      timestamp: z.coerce.date(),
    })
  ),
  heartbeatIntervalMs: z.number().positive(),
});

export type TaskDispatchPayload = z.infer<typeof TaskDispatchPayloadSchema>;

// ============================================================================
// Task Callback (Worker -> Orchestrator)
// ============================================================================

export const TaskCallbackPayloadSchema = z.object({
  status: z.enum(['success', 'failed']),
  outputPath: z.string().optional(),
  outputSize: z.number().nonnegative().optional(),
  assets: z.record(AssetMetadataSchema).optional(),
  logsPath: z.string().optional(),
  selectedNext: z.array(z.string()).optional(),
  error: z.string().optional(),
  errorCode: z.string().optional(),
});

export type TaskCallbackPayload = z.infer<typeof TaskCallbackPayloadSchema>;

// ============================================================================
// Heartbeat
// ============================================================================

export const HeartbeatRequestSchema = z.object({
  runId: z.string(),
  progress: z.number().min(0).max(100).optional(),
  message: z.string().optional(),
});

export type HeartbeatRequest = z.infer<typeof HeartbeatRequestSchema>;

export const HeartbeatResponseSchema = z.object({
  acknowledged: z.boolean(),
  shouldCancel: z.boolean().optional(),
});

export type HeartbeatResponse = z.infer<typeof HeartbeatResponseSchema>;

// ============================================================================
// Dead Letter Queue
// ============================================================================

export const DLQItemSchema = z.object({
  id: z.string(),
  taskRunId: z.string(),
  taskId: z.string(),
  pipelineRunId: z.string().optional(),
  codeVersion: z.number().positive(),
  codeHash: z.string(),
  error: z.string(),
  attempts: z.number().positive(),
  failedAt: z.coerce.date(),
  input: z.unknown(),
});

export type DLQItem = z.infer<typeof DLQItemSchema>;

export const DLQListResponseSchema = z.object({
  items: z.array(DLQItemSchema),
  total: z.number(),
});

export type DLQListResponse = z.infer<typeof DLQListResponseSchema>;

export const DLQRetryResponseSchema = z.object({
  newRunId: z.string(),
  status: z.string(),
  codeVersion: z.number().positive(),
});

export type DLQRetryResponse = z.infer<typeof DLQRetryResponseSchema>;

// ============================================================================
// Task Code History
// ============================================================================

export const TaskCodeHistoryResponseSchema = z.array(
  z.object({
    codeVersion: z.number().positive(),
    codeHash: z.string(),
    serviceVersion: z.string(),
    recordedAt: z.coerce.date(),
  })
);

export type TaskCodeHistoryResponse = z.infer<typeof TaskCodeHistoryResponseSchema>;

// ============================================================================
// Dry Run
// ============================================================================

export const DryRunRequestSchema = z.object({
  input: z.unknown(),
});

export type DryRunRequest = z.infer<typeof DryRunRequestSchema>;

export const DryRunResponseSchema = z.object({
  valid: z.boolean(),
  executionPlan: z.array(
    z.object({
      step: z.number(),
      tasks: z.array(z.string()),
      type: z.enum(['entry', 'parallel', 'join', 'end']),
      waitsFor: z.array(z.string()).optional(),
    })
  ),
  warnings: z.array(z.string()).optional(),
  errors: z.array(z.string()).optional(),
});

export type DryRunResponse = z.infer<typeof DryRunResponseSchema>;