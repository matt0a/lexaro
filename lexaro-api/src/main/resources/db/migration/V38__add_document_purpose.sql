-- V38__add_document_purpose.sql

ALTER TABLE documents
    ADD COLUMN IF NOT EXISTS purpose TEXT NOT NULL DEFAULT 'AUDIO';

DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint c
            WHERE c.conname = 'documents_purpose_chk'
              AND c.conrelid = 'documents'::regclass
        ) THEN
            ALTER TABLE documents
                ADD CONSTRAINT documents_purpose_chk
                    CHECK (purpose IN ('AUDIO','EDUCATION','BOTH'));
        END IF;
    END $$;

CREATE INDEX IF NOT EXISTS idx_documents_user_purpose
    ON documents(user_id, purpose)
    WHERE deleted_at IS NULL;
