CREATE INDEX IF NOT EXISTS idx_documents_expires_at
    ON documents (expires_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_documents_user_uploaded
    ON documents (user_id, uploaded_at DESC) WHERE deleted_at IS NULL;
