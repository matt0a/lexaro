-- Make sure table exists and column types are what we expect

CREATE TABLE IF NOT EXISTS public.document_texts (
                                                     doc_id       BIGINT PRIMARY KEY,
                                                     mime         TEXT        NOT NULL,
                                                     text         TEXT        NOT NULL,
                                                     char_count   INTEGER     NOT NULL CHECK (char_count >= 0),
    extracted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_document_texts_doc'
    ) THEN
ALTER TABLE public.document_texts
    ADD CONSTRAINT fk_document_texts_doc
        FOREIGN KEY (doc_id) REFERENCES public.documents(id) ON DELETE CASCADE;
END IF;
END $$;

-- Ensure column types are TEXT (no-op if already correct)
ALTER TABLE public.document_texts
ALTER COLUMN mime TYPE TEXT,
    ALTER COLUMN text TYPE TEXT;

CREATE INDEX IF NOT EXISTS idx_document_texts_extracted_at
    ON public.document_texts (extracted_at);
