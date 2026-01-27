-- Notes storage for education feature
-- Stores AI-generated study notes for documents

CREATE TABLE education_notes (
    id              BIGSERIAL PRIMARY KEY,
    doc_id          BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(255),
    style           VARCHAR(50) NOT NULL DEFAULT 'outline',  -- outline, cornell, detailed, summary
    content         TEXT NOT NULL,
    page_start      INT,
    page_end        INT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient lookups
CREATE INDEX idx_education_notes_doc_id ON education_notes(doc_id);
CREATE INDEX idx_education_notes_user_id ON education_notes(user_id);
CREATE INDEX idx_education_notes_style ON education_notes(style);
