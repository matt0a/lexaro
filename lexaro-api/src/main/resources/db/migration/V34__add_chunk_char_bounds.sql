-- Add missing char-boundary columns required by DocumentTextChunk entity

ALTER TABLE public.document_text_chunks
    ADD COLUMN IF NOT EXISTS start_char integer,
    ADD COLUMN IF NOT EXISTS end_char integer;

-- Optional backfill for existing rows (safe; columns are nullable anyway)
UPDATE public.document_text_chunks
SET
    start_char = COALESCE(start_char, 0),
    end_char   = COALESCE(end_char, LENGTH(text))
WHERE start_char IS NULL OR end_char IS NULL;
