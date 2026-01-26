-- Education foundations (chunks + usage + attempts + user stats + workspace)

CREATE TABLE IF NOT EXISTS education_workspace (
                                                   id BIGSERIAL PRIMARY KEY,
                                                   user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                                   name TEXT NOT NULL,
                                                   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_education_workspace_user_created
    ON education_workspace(user_id, created_at);


CREATE TABLE IF NOT EXISTS document_text_chunks (
                                                    id BIGSERIAL PRIMARY KEY,
                                                    doc_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
                                                    chunk_index INT NOT NULL,
                                                    page_start INT,
                                                    page_end INT,
                                                    text TEXT NOT NULL,
                                                    topic_tag TEXT,
                                                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                                    UNIQUE (doc_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_doc_chunks_doc
    ON document_text_chunks(doc_id);

CREATE INDEX IF NOT EXISTS idx_doc_chunks_doc_page_start
    ON document_text_chunks(doc_id, page_start);

CREATE INDEX IF NOT EXISTS idx_doc_chunks_topic
    ON document_text_chunks(topic_tag);


CREATE TABLE IF NOT EXISTS ai_usage (
                                        id BIGSERIAL PRIMARY KEY,
                                        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                        plan TEXT NOT NULL,
                                        feature_key TEXT NOT NULL,
                                        requests_count INT NOT NULL DEFAULT 0,
                                        tokens_in BIGINT NOT NULL DEFAULT 0,
                                        tokens_out BIGINT NOT NULL DEFAULT 0,
                                        window_start TIMESTAMPTZ NOT NULL,
                                        window_end TIMESTAMPTZ NOT NULL,
                                        version BIGINT NOT NULL DEFAULT 0,
                                        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                        UNIQUE (user_id, feature_key, window_start, window_end)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_window
    ON ai_usage(user_id, window_start);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_feature
    ON ai_usage(user_id, feature_key);


CREATE TABLE IF NOT EXISTS education_attempt_event (
                                                       id BIGSERIAL PRIMARY KEY,
                                                       user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                                       doc_id BIGINT REFERENCES documents(id) ON DELETE SET NULL,
                                                       attempt_type TEXT NOT NULL,
                                                       mode TEXT NOT NULL,
                                                       score NUMERIC(10,2),
                                                       max_score NUMERIC(10,2),
                                                       percent NUMERIC(5,2),
                                                       weak_topics TEXT[],
                                                       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_edu_attempt_user_created
    ON education_attempt_event(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_edu_attempt_user_mode
    ON education_attempt_event(user_id, mode);

CREATE INDEX IF NOT EXISTS idx_edu_attempt_doc
    ON education_attempt_event(doc_id);


CREATE TABLE IF NOT EXISTS education_user_stats (
                                                    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                                                    streak_days INT NOT NULL DEFAULT 0,
                                                    last_study_at TIMESTAMPTZ,
                                                    avg_accuracy NUMERIC(5,2),
                                                    attempts_last_30 INT NOT NULL DEFAULT 0,
                                                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
