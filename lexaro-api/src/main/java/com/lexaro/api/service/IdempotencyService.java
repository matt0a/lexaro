package com.lexaro.api.service;

import com.lexaro.api.domain.IdempotencyRecord;
import com.lexaro.api.repo.IdempotencyRepository;
import com.lexaro.api.web.support.ETagHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Manages idempotency keys for safe job-start retry behavior.
 *
 * <p>The key hash is computed as SHA-256({@code userId:endpoint:clientKey}), which scopes
 * each client-supplied key to both the authenticated user and the specific endpoint. This
 * prevents cross-user collisions and cross-endpoint collisions on the same key string.
 *
 * <p>Records are stored for 24 hours and are replayed verbatim on duplicate requests
 * within that window. Expired records are cleaned up by {@link #cleanupExpired()}, which
 * runs on a fixed hourly schedule.
 *
 * <p>{@code @EnableScheduling} is already active on
 * {@link com.lexaro.api.LexaroApiApplication}, so no additional configuration is needed
 * for the scheduled cleanup method.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class IdempotencyService {

    private final IdempotencyRepository repo;

    /**
     * Computes the idempotency key hash as SHA-256({@code userId:endpoint:clientKey}).
     *
     * <p>Reuses {@link ETagHelper#sha256Hex(String)} from Phase 4 — no duplication of
     * the hashing logic.
     *
     * @param userId    the authenticated user's ID
     * @param endpoint  a canonical endpoint identifier (e.g. {@code "POST:/documents/{docId}/audio/start"})
     * @param clientKey the raw {@code Idempotency-Key} header value supplied by the client
     * @return a 64-character lowercase hex SHA-256 digest
     */
    public String computeKeyHash(Long userId, String endpoint, String clientKey) {
        String raw = userId + ":" + endpoint + ":" + clientKey;
        return ETagHelper.sha256Hex(raw);
    }

    /**
     * Looks up an existing idempotency record.
     *
     * <p>Returns {@link Optional#empty()} if no record exists for the given key triple,
     * or if the record has already expired. Expired records remain in the database until
     * the next scheduled cleanup run; we filter them out here rather than relying on
     * database-side TTL enforcement.
     *
     * @param userId    the authenticated user's ID
     * @param endpoint  canonical endpoint identifier
     * @param clientKey the raw {@code Idempotency-Key} header value
     * @return an Optional containing the live record, or empty if absent or expired
     */
    public Optional<IdempotencyRecord> find(Long userId, String endpoint, String clientKey) {
        String hash = computeKeyHash(userId, endpoint, clientKey);
        return repo.findById(hash)
                // Filter out records that have passed their expiry time but not yet been cleaned up.
                .filter(r -> r.getExpiresAt().isAfter(LocalDateTime.now()));
    }

    /**
     * Stores the result of a job-start operation for future idempotent replay.
     *
     * <p>If a record with the same key hash already exists (e.g. a race condition where
     * two concurrent requests both pass the initial find check), {@link JpaRepository#save}
     * will overwrite the existing row because {@code keyHash} is the {@code @Id}. This is
     * safe: both concurrent callers would have dispatched equivalent jobs, and the stored
     * response body is identical.
     *
     * @param userId       the authenticated user's ID
     * @param endpoint     canonical endpoint identifier
     * @param clientKey    the raw {@code Idempotency-Key} header value
     * @param responseBody the serialized response body to replay on future duplicate requests
     */
    public void store(Long userId, String endpoint, String clientKey, String responseBody) {
        String hash = computeKeyHash(userId, endpoint, clientKey);
        LocalDateTime now = LocalDateTime.now();
        IdempotencyRecord record = IdempotencyRecord.builder()
                .keyHash(hash)
                .userId(userId)
                .endpoint(endpoint)
                .response(responseBody)
                .createdAt(now)
                .expiresAt(now.plusHours(24))
                .build();
        repo.save(record);
        log.debug("Stored idempotency record: hash={}, endpoint={}", hash, endpoint);
    }

    /**
     * Scheduled cleanup of expired idempotency records.
     *
     * <p>Runs every hour (3 600 000 ms). The {@code @Transactional} annotation ensures
     * the bulk DELETE runs in a transaction even though the scheduler does not provide one.
     * Logged at DEBUG level only — this is a routine maintenance task, not an operational event.
     */
    @Scheduled(fixedRate = 3_600_000)
    @Transactional
    public void cleanupExpired() {
        LocalDateTime now = LocalDateTime.now();
        repo.deleteExpired(now);
        log.debug("Idempotency key cleanup executed at {}", now);
    }
}
