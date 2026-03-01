-- =============================================================================
-- V46__add_performance_indexes.sql
-- =============================================================================
-- Adds two targeted performance indexes identified during Phase 6 profiling.
-- No CONCURRENTLY is used: Flyway executes migrations inside a transaction by
-- default and CONCURRENTLY is incompatible with transactions.  All statements
-- use IF NOT EXISTS for idempotency (safe to re-run on a restored snapshot).
--
-- Pre-existing indexes NOT recreated here (already covered by earlier versions):
--   V8  : idx_documents_expires_at        ON documents(expires_at) WHERE deleted_at IS NULL
--   V8  : idx_documents_user_uploaded     ON documents(user_id, uploaded_at DESC) WHERE deleted_at IS NULL
--   V20 : idx_documents_user_status       ON documents(user_id, audio_status)
--   V20 : idx_documents_user              ON documents(user_id)
--   V20 : idx_docs_audio_ready            ON documents(audio_status, user_id)
--   V38 : idx_documents_user_purpose      ON documents(user_id, purpose) WHERE deleted_at IS NULL
--   V45 : idx_idempotency_expires         ON idempotency_keys(expires_at)  -- noted, not recreated
--
-- DocumentResponse DTO verified clean (no text blob leakage):
--   record DocumentResponse(id, filename, mime, sizeBytes, pages,
--                           status, uploadedAt, expiresAt, planAtUpload)
--   The extracted text body lives only in document_texts and is never returned
--   by the list endpoint, so the covering index below carries no security risk.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- INDEX 1: Partial index for PROCESSING gauge (Micrometer / Phase 6)
-- -----------------------------------------------------------------------------
-- Purpose : DocumentService / Micrometer gauge calls countByAudioStatus('PROCESSING')
--           on every scrape interval.  A partial index restricted to the single
--           enum value makes that count O(index size) instead of O(table size).
--
-- Replaces: A sequential scan of the full documents table filtered post-scan.
-- Scope   : Only rows where audio_status = 'PROCESSING' are stored in the index,
--           keeping it tiny even as the table grows.
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_documents_audio_status_processing
    ON documents (audio_status)
    WHERE audio_status = 'PROCESSING';


-- -----------------------------------------------------------------------------
-- INDEX 2: Covering index for purpose-filtered, paginated document list
-- -----------------------------------------------------------------------------
-- Purpose : DocumentService.list(userId, pageable, purposeRaw) calls:
--
--     findByUserIdAndDeletedAtIsNullAndPurposeIn(userId, allowed, pageable)
--
--   Typical generated SQL (Spring Data JPA):
--
--     SELECT *
--     FROM   documents
--     WHERE  user_id   = $1
--       AND  deleted_at IS NULL
--       AND  purpose   IN ($2, $3)       -- e.g. 'EDUCATION', 'BOTH'
--     ORDER  BY uploaded_at DESC
--     LIMIT  $4 OFFSET $5;
--
--   EXPLAIN (ANALYZE) without this index shows:
--     -> Index Scan on idx_documents_user_purpose  (cost=... rows=... width=...)
--        + Sort  (cost=high)                       <-- extra sort pass on uploaded_at
--
--   With this index the planner can use an index-only scan that is already
--   sorted by uploaded_at DESC, eliminating the sort node entirely.
--
-- Supersedes: idx_documents_user_purpose (V38) for the paginated list path.
--   V38's index remains valid for non-paginated or non-sorted queries; this
--   wider index is chosen by the planner when ORDER BY uploaded_at is present.
--
-- Partial condition: WHERE deleted_at IS NULL matches the JPA method predicate
--   exactly, so soft-deleted rows are excluded from the index pages entirely.
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_documents_user_purpose_created
    ON documents (user_id, purpose, uploaded_at DESC)
    WHERE deleted_at IS NULL;
