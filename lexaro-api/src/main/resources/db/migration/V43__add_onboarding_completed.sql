-- V43: Add onboarding_completed flag to users table
-- Tracks whether user has completed the education onboarding wizard

ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for quick lookup of users who haven't completed onboarding
CREATE INDEX IF NOT EXISTS idx_users_onboarding ON users(onboarding_completed) WHERE NOT onboarding_completed;
