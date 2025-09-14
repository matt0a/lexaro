CREATE TABLE IF NOT EXISTS documents (
                                         id BIGSERIAL PRIMARY KEY,
                                         user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    filename   TEXT NOT NULL,
    mime       TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    sha256     CHAR(64),
    pages      INT,

    status TEXT NOT NULL CHECK (status IN ('UPLOADED','PROCESSING','READY','FAILED','EXPIRED')),

    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMPTZ,
    deleted_at  TIMESTAMPTZ,

    plan_at_upload TEXT NOT NULL CHECK (plan_at_upload IN ('FREE','PREMIUM'))
    );

CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
