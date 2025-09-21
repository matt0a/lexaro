CREATE TABLE IF NOT EXISTS document_texts (
                                              doc_id       BIGINT PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
    mime         TEXT NOT NULL,
    text         TEXT NOT NULL,
    char_count   INT  NOT NULL,
    extracted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

CREATE INDEX IF NOT EXISTS idx_document_texts_extracted_at ON document_texts(extracted_at);
