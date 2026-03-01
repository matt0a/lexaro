package com.lexaro.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * JPA entity representing a stored idempotency key and its associated response body.
 *
 * <p>Idempotency keys allow clients to safely retry job-start requests (e.g. audio
 * generation) without the risk of starting duplicate jobs. The {@code keyHash} is a
 * SHA-256 digest of {@code userId:endpoint:clientKey}, which scopes each client-supplied
 * key to both the authenticated user and the specific endpoint.
 *
 * <p>Records expire after 24 hours ({@code expiresAt}) and are periodically purged by
 * {@link com.lexaro.api.service.IdempotencyService#cleanupExpired()}.
 */
@Entity
@Table(name = "idempotency_keys")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IdempotencyRecord {

    /**
     * Primary key: SHA-256 hex digest of {@code userId:endpoint:clientIdempotencyKey}.
     * 64 characters — the fixed length of a SHA-256 hex output.
     */
    @Id
    @Column(name = "key_hash", length = 64, nullable = false)
    private String keyHash;

    /**
     * The ID of the user that issued the original request.
     * Stored as a plain BIGINT (no FK entity relationship needed here).
     */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    /**
     * A canonical endpoint identifier, e.g. {@code "POST:/documents/{docId}/audio/start"}.
     * Used as part of the hash so that the same client key does not collide across endpoints.
     */
    @Column(name = "endpoint", length = 128, nullable = false)
    private String endpoint;

    /**
     * The JSON-serialized response body that was returned for the original request.
     * This is replayed verbatim when a duplicate request arrives with the same key.
     */
    @Column(name = "response", nullable = false, columnDefinition = "TEXT")
    private String response;

    /** Timestamp at which this record was created (UTC, no timezone stored). */
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    /**
     * Timestamp after which this record is considered expired and eligible for deletion.
     * Set to {@code createdAt + 24 hours} at write time.
     */
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;
}
