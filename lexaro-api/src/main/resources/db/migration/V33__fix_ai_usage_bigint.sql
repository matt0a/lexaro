-- Fix ai_usage counters to BIGINT to match entity (Long)

-- If any rows exist, make sure nulls won't break NOT NULL defaults later
UPDATE public.ai_usage
SET
    requests_count = COALESCE(requests_count, 0),
    tokens_in      = COALESCE(tokens_in, 0),
    tokens_out     = COALESCE(tokens_out, 0);

-- Convert types
ALTER TABLE public.ai_usage
    ALTER COLUMN requests_count TYPE bigint USING requests_count::bigint,
    ALTER COLUMN tokens_in      TYPE bigint USING tokens_in::bigint,
    ALTER COLUMN tokens_out     TYPE bigint USING tokens_out::bigint;

-- Keep sane defaults (recommended)
ALTER TABLE public.ai_usage
    ALTER COLUMN requests_count SET DEFAULT 0,
    ALTER COLUMN tokens_in      SET DEFAULT 0,
    ALTER COLUMN tokens_out     SET DEFAULT 0;

-- Optional strictness (uncomment if you want)
-- ALTER TABLE public.ai_usage
--   ALTER COLUMN requests_count SET NOT NULL,
--   ALTER COLUMN tokens_in      SET NOT NULL,
--   ALTER COLUMN tokens_out     SET NOT NULL;
