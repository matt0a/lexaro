ALTER TABLE documents
    ADD COLUMN IF NOT EXISTS object_key TEXT;

CREATE INDEX IF NOT EXISTS idx_documents_expires_at
    ON documents(expires_at);
