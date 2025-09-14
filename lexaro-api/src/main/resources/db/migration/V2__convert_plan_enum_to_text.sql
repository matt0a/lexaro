-- Convert users.plan from PostgreSQL ENUM 'plan' to TEXT with a CHECK constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'plan' AND udt_name = 'plan'
  ) THEN
ALTER TABLE users ALTER COLUMN plan TYPE TEXT USING plan::text;

-- keep it safe: enforce allowed values
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_plan_check;
ALTER TABLE users ADD CONSTRAINT users_plan_check CHECK (plan IN ('FREE','PREMIUM'));
END IF;

  -- drop enum type if nothing else uses it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE udt_name = 'plan'
  ) THEN
DROP TYPE IF EXISTS plan;
END IF;
END$$;
