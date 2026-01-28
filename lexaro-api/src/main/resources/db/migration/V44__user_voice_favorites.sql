-- User voice favorites table
-- Stores which voices a user has marked as favorites for quick access

CREATE TABLE user_voice_favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    voice_id VARCHAR(255) NOT NULL,
    provider VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, voice_id, provider)
);

CREATE INDEX idx_user_voice_favorites_user ON user_voice_favorites(user_id);
