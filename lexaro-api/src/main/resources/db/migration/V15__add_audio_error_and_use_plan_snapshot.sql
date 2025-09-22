-- error message captured when async worker fails
ALTER TABLE documents ADD COLUMN IF NOT EXISTS audio_error text;

-- optional: backfill NULLs
UPDATE documents SET audio_error = NULL WHERE audio_error IS NULL;
