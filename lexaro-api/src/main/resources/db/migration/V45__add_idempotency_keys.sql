-- Idempotency keys for safe job-start retry behavior.
-- key_hash = SHA256(userId + ':' + endpoint + ':' + clientIdempotencyKey)
-- so the same client key is scoped to both the user and the endpoint.
CREATE TABLE IF NOT EXISTS idempotency_keys (
    key_hash   VARCHAR(64)  NOT NULL,
    user_id    BIGINT       NOT NULL REFERENCES users(id),
    endpoint   VARCHAR(128) NOT NULL,
    response   TEXT         NOT NULL,     -- JSON-serialized response body
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW() + INTERVAL '24 hours',
    CONSTRAINT pk_idempotency_keys PRIMARY KEY (key_hash)
);

-- Index to support the scheduled cleanup query (DELETE WHERE expires_at < NOW()).
-- NOTE: CREATE INDEX CONCURRENTLY is NOT used because Flyway runs inside a transaction.
CREATE INDEX IF NOT EXISTS idx_idempotency_expires
    ON idempotency_keys (expires_at);
