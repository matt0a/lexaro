-- Users: verification fields
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS verification_token text,
    ADD COLUMN IF NOT EXISTS verification_sent_at timestamptz,
    ADD COLUMN IF NOT EXISTS verified_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_users_verified ON users(verified);

-- Daily TTS usage table
CREATE TABLE IF NOT EXISTS tts_usage_daily (
                                               user_id    bigint     NOT NULL,
                                               day_ymd    text       NOT NULL, -- e.g. "2025-09-22" (UTC)
                                               chars_used bigint     NOT NULL,
                                               updated_at timestamptz NOT NULL DEFAULT now(),
                                               PRIMARY KEY (user_id, day_ymd)
);

-- Helpful for concurrency guard (count user’s processing jobs fast)
CREATE INDEX IF NOT EXISTS idx_documents_user_audio_status
    ON documents(user_id, audio_status);
