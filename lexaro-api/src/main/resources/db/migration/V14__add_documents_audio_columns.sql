ALTER TABLE documents
    ADD COLUMN IF NOT EXISTS audio_status     TEXT,
    ADD COLUMN IF NOT EXISTS audio_engine     TEXT,
    ADD COLUMN IF NOT EXISTS audio_voice      TEXT,
    ADD COLUMN IF NOT EXISTS audio_format     TEXT,
    ADD COLUMN IF NOT EXISTS audio_object_key TEXT;
