ALTER TABLE public.document_texts
    ALTER COLUMN version TYPE BIGINT;

ALTER TABLE public.document_texts
    ALTER COLUMN version SET DEFAULT 0;

UPDATE public.document_texts
SET version = 0
WHERE version IS NULL;

ALTER TABLE public.document_texts
    ALTER COLUMN version SET NOT NULL;
