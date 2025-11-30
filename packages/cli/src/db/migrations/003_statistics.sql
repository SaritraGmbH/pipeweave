-- Migration: 003_statistics
-- Description: Add statistics tables for time-series metrics with T-Digest support
-- Created: 2025-11-30

-- ============================================================================
-- Statistics Time-Series Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS statistics_timeseries (
  id SERIAL PRIMARY KEY,
  bucket_timestamp TIMESTAMPTZ NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('system', 'service', 'task', 'pipeline')),
  scope_id TEXT, -- NULL for system, service_id, task_id, or pipeline_id otherwise

  -- Task run counts
  task_run_count INTEGER NOT NULL DEFAULT 0,
  task_completed INTEGER NOT NULL DEFAULT 0,
  task_failed INTEGER NOT NULL DEFAULT 0,
  task_timeout INTEGER NOT NULL DEFAULT 0,
  task_cancelled INTEGER NOT NULL DEFAULT 0,
  task_pending INTEGER NOT NULL DEFAULT 0,
  task_running INTEGER NOT NULL DEFAULT 0,

  -- Pipeline run counts
  pipeline_run_count INTEGER NOT NULL DEFAULT 0,
  pipeline_completed INTEGER NOT NULL DEFAULT 0,
  pipeline_failed INTEGER NOT NULL DEFAULT 0,
  pipeline_cancelled INTEGER NOT NULL DEFAULT 0,
  pipeline_partial INTEGER NOT NULL DEFAULT 0,

  -- Task runtime statistics (milliseconds)
  task_runtime_count INTEGER NOT NULL DEFAULT 0,
  task_runtime_sum_ms BIGINT NOT NULL DEFAULT 0,
  task_runtime_min_ms INTEGER,
  task_runtime_max_ms INTEGER,
  task_runtime_tdigest JSONB, -- T-Digest sketch for percentile calculation

  -- Wait time statistics (milliseconds) - time from created to started
  wait_time_count INTEGER NOT NULL DEFAULT 0,
  wait_time_sum_ms BIGINT NOT NULL DEFAULT 0,
  wait_time_min_ms INTEGER,
  wait_time_max_ms INTEGER,
  wait_time_tdigest JSONB, -- T-Digest sketch for percentile calculation

  -- Pipeline runtime statistics (milliseconds)
  pipeline_runtime_count INTEGER NOT NULL DEFAULT 0,
  pipeline_runtime_sum_ms BIGINT NOT NULL DEFAULT 0,
  pipeline_runtime_min_ms INTEGER,
  pipeline_runtime_max_ms INTEGER,
  pipeline_runtime_tdigest JSONB, -- T-Digest sketch for percentile calculation

  -- Queue metrics (snapshot at end of bucket)
  queue_depth_pending INTEGER,
  queue_depth_running INTEGER,
  queue_depth_waiting INTEGER,

  -- Error breakdown
  errors_by_code JSONB DEFAULT '{}'::jsonb, -- { "TIMEOUT": 5, "VALIDATION_ERROR": 3 }

  -- Retry statistics
  retry_count INTEGER NOT NULL DEFAULT 0,
  retry_success_count INTEGER NOT NULL DEFAULT 0,

  -- DLQ statistics
  dlq_added_count INTEGER NOT NULL DEFAULT 0,
  dlq_retried_count INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  is_complete BOOLEAN NOT NULL DEFAULT FALSE,
  last_built_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_bucket_scope UNIQUE (bucket_timestamp, scope, scope_id)
);

CREATE INDEX IF NOT EXISTS idx_statistics_timeseries_bucket
  ON statistics_timeseries(bucket_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_statistics_timeseries_scope
  ON statistics_timeseries(scope, scope_id, bucket_timestamp DESC)
  WHERE scope_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_statistics_timeseries_incomplete
  ON statistics_timeseries(bucket_timestamp DESC)
  WHERE is_complete = FALSE;

COMMENT ON TABLE statistics_timeseries IS 'Pre-aggregated time-series statistics in 1-minute buckets with T-Digest for percentile calculation';
COMMENT ON COLUMN statistics_timeseries.task_runtime_tdigest IS 'T-Digest sketch for task runtime percentiles (p50, p95, p99)';
COMMENT ON COLUMN statistics_timeseries.wait_time_tdigest IS 'T-Digest sketch for queue wait time percentiles (p50, p95, p99)';
COMMENT ON COLUMN statistics_timeseries.pipeline_runtime_tdigest IS 'T-Digest sketch for pipeline runtime percentiles (p50, p95, p99)';
COMMENT ON COLUMN statistics_timeseries.is_complete IS 'TRUE for historical buckets (immutable), FALSE for current bucket (rebuilt periodically)';

-- ============================================================================
-- Performance Indexes for Statistics Queries
-- ============================================================================

-- Composite index for task-level statistics queries
CREATE INDEX IF NOT EXISTS idx_task_runs_task_stats
  ON task_runs(task_id, completed_at, status)
  WHERE completed_at IS NOT NULL;

-- Composite index for pipeline statistics queries
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_stats
  ON pipeline_runs(pipeline_id, completed_at, status)
  WHERE completed_at IS NOT NULL;

-- Error analysis index
CREATE INDEX IF NOT EXISTS idx_task_runs_errors
  ON task_runs(error_code, completed_at)
  WHERE error_code IS NOT NULL;

-- Wait time calculation index
CREATE INDEX IF NOT EXISTS idx_task_runs_wait_time
  ON task_runs(created_at, started_at)
  WHERE started_at IS NOT NULL;

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to get current minute bucket timestamp
CREATE OR REPLACE FUNCTION get_current_minute_bucket()
RETURNS TIMESTAMPTZ AS $$
BEGIN
  RETURN date_trunc('minute', NOW());
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION get_current_minute_bucket() IS 'Returns current timestamp truncated to minute for bucket alignment';

-- Function to cleanup old statistics (optional retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_statistics(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM statistics_timeseries
  WHERE bucket_timestamp < NOW() - (retention_days || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_statistics(INTEGER) IS 'Delete statistics older than retention period (default 90 days)';
