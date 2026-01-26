-- Fix schema validation: education_user_stats.avg_accuracy should be double precision (float8)
DO $$
    BEGIN
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name   = 'education_user_stats'
              AND column_name  = 'avg_accuracy'
              AND data_type    = 'numeric'
        ) THEN
            ALTER TABLE public.education_user_stats
                ALTER COLUMN avg_accuracy TYPE double precision
                    USING avg_accuracy::double precision;
        END IF;
    END $$;
