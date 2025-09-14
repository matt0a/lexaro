-- Make plan_at_upload a TEXT column (not the Postgres enum)
ALTER TABLE documents
ALTER COLUMN plan_at_upload TYPE TEXT
  USING plan_at_upload::text;

-- Ensure only valid values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'documents_plan_at_upload_chk'
  ) THEN
ALTER TABLE documents
    ADD CONSTRAINT documents_plan_at_upload_chk
        CHECK (plan_at_upload IN ('FREE','PREMIUM'));
END IF;
END $$;
