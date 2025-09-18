ALTER TABLE documents
    ADD COLUMN IF NOT EXISTS object_key TEXT, -- original file key (you already set this in code)
    ADD COLUMN IF NOT EXISTS audio_status TEXT NOT NULL DEFAULT 'NONE' CHECK (audio_status IN ('NONE','PROCESSING','READY','FAILED')),
    ADD COLUMN IF NOT EXISTS audio_object_key TEXT,
    ADD COLUMN IF NOT EXISTS audio_format TEXT,     -- e.g. 'mp3'
    ADD COLUMN IF NOT EXISTS audio_voice  TEXT,     -- e.g. 'Joanna'
    ADD COLUMN IF NOT EXISTS audio_duration_sec INT;
