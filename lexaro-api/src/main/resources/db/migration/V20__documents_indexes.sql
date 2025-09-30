-- flyway:executeInTransaction=false

-- Speeds up “count/find by user + status” and general per-user listing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_user_status
    ON documents(user_id, audio_status);

-- Optional but useful: fast “all docs for a user”
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_user
    ON documents(user_id);

-- Optional: fast “all READY (or any status) then by user” lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_docs_audio_ready
    ON documents(audio_status, user_id);

