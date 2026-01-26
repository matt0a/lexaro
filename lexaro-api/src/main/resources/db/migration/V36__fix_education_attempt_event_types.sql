-- Fix education_attempt_event column types to match Hibernate expectations

DO $$
    BEGIN
        -- score: numeric -> integer (if needed)
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
                    USING ROUND(score)::integer;
        END IF;

        -- max_score: numeric -> integer (if needed)
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
                    USING ROUND(max_score)::integer;
        END IF;

        -- percent: numeric -> double precision (if needed)
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name   = 'education_attempt_event'
              AND column_name  = 'percent'
              AND data_type    = 'numeric'
        ) THEN
            ALTER TABLE public.education_attempt_event
                ALTER COLUMN percent TYPE double precision
                    USING percent::double precision;
        END IF;
    END $$;
