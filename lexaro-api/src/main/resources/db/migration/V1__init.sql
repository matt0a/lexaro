-- Enums
CREATE TYPE plan AS ENUM ('FREE','PREMIUM');
CREATE TYPE doc_status AS ENUM ('UPLOADED','PROCESSING','READY','FAILED','EXPIRED');

-- Users & subscriptions
CREATE TABLE users (
                       id BIGSERIAL PRIMARY KEY,
                       email TEXT NOT NULL UNIQUE,
                       password_hash TEXT NOT NULL,
                       plan plan NOT NULL DEFAULT 'FREE',
                       retention_days INT NOT NULL DEFAULT 0,
                       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE subscriptions (
                               id BIGSERIAL PRIMARY KEY,
                               user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                               stripe_customer_id TEXT,
                               stripe_subscription_id TEXT,
                               status TEXT,
                               current_period_end TIMESTAMPTZ
);

-- Documents & audio assets
CREATE TABLE documents (
                           id BIGSERIAL PRIMARY KEY,
                           user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                           filename TEXT NOT NULL,
                           mime TEXT NOT NULL,
                           size_bytes BIGINT NOT NULL,
                           sha256 CHAR(64),
                           pages INT,
                           status doc_status NOT NULL,
                           uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                           expires_at TIMESTAMPTZ,
                           deleted_at TIMESTAMPTZ,
                           plan_at_upload plan NOT NULL
);

CREATE TABLE audio_assets (
                              id BIGSERIAL PRIMARY KEY,
                              document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
                              part_index INT NOT NULL,
                              s3_key TEXT NOT NULL,
                              duration_sec INT,
                              created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                              UNIQUE (document_id, part_index)
);

-- Bookmarks
CREATE TABLE bookmarks (
                           id BIGSERIAL PRIMARY KEY,
                           document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
                           user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                           position_sec INT NOT NULL,
                           label TEXT,
                           created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helpful indexes
CREATE INDEX idx_documents_user ON documents(user_id);
CREATE INDEX idx_audio_assets_doc ON audio_assets(document_id);
CREATE INDEX idx_bookmarks_doc_user ON bookmarks(document_id, user_id);
