-- =============================================================================
-- V47__add_jobs.sql
-- =============================================================================
-- Creates the durable job table for restart-safe async job processing.
-- The unique partial index on (doc_id, type) WHERE status IN ('PENDING','RUNNING')
-- enforces DB-level idempotency: only one active job per document+type.
-- No CONCURRENTLY: Flyway wraps migrations in transactions by default.
-- =============================================================================

CREATE TABLE IF NOT EXISTS job (
    id          BIGSERIAL    PRIMARY KEY,
    type        VARCHAR(32)  NOT NULL,
    user_id     BIGINT       NOT NULL REFERENCES users(id),
    doc_id      BIGINT       NOT NULL REFERENCES documents(id),
    status      VARCHAR(16)  NOT NULL DEFAULT 'PENDING',
    payload     TEXT         NULL,
    attempts    INT          NOT NULL DEFAULT 0,
    next_run_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    locked_at   TIMESTAMP WITHOUT TIME ZONE NULL,
    locked_by   VARCHAR(64)  NULL,
    error       TEXT         NULL,
    created_at  TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- Efficient poll query: status=PENDING ordered by next_run_at
CREATE INDEX IF NOT EXISTS idx_job_status_next_run
    ON job(status, next_run_at);

-- Look up existing jobs by document + type
CREATE INDEX IF NOT EXISTS idx_job_doc_type
    ON job(doc_id, type);

-- DB-level dedup: only one PENDING or RUNNING job per (doc_id, type).
-- Inserting a duplicate raises a unique constraint violation which JobService
-- catches and treats as "already enqueued" (idempotent enqueue semantics).
CREATE UNIQUE INDEX IF NOT EXISTS idx_job_active_dedup
    ON job(doc_id, type)
    WHERE status IN ('PENDING', 'RUNNING');
