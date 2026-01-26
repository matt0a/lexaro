-- Fix schema validation issues for education module

-- 1) document_text_chunks: add missing char-range columns (Hibernate expects them)
ALTER TABLE public.document_text_chunks
    ADD COLUMN IF NOT EXISTS start_char integer,
    ADD COLUMN IF NOT EXISTS end_char integer;

-- 2) education_attempt_event: fix numeric -> integer mismatch for score/max_score
DO $$
    BEGIN
        -- max_score
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name   = 'education_attempt_event'
              AND column_name  = 'max_score'
              AND data_type    = 'numeric'
        ) THEN
            ALTER TABLE public.education_attempt_event
                ALTER COLUMN max_score TYPE integer
                    USING max_score::integer;
        END IF;

        -- score (optional safety: if your migration also made this numeric, fix it too)
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name   = 'education_attempt_event'
              AND column_name  = 'score'
              AND data_type    = 'numeric'
        ) THEN
            ALTER TABLE public.education_attempt_event
                ALTER COLUMN score TYPE integer
                    USING score::integer;
        END IF;
    END $$;
