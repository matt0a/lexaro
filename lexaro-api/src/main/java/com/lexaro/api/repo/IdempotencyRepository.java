package com.lexaro.api.repo;

import com.lexaro.api.domain.IdempotencyRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Spring Data JPA repository for {@link IdempotencyRecord} entities.
 *
 * <p>The primary key is the SHA-256 key hash (a {@code String}), so
 * {@link JpaRepository} is parameterised with {@code <IdempotencyRecord, String>}.
 */
public interface IdempotencyRepository extends JpaRepository<IdempotencyRecord, String> {

    /**
     * Deletes all idempotency records whose {@code expiresAt} is before the given timestamp.
     * Called by the scheduled cleanup job in {@link com.lexaro.api.service.IdempotencyService}.
     *
     * <p>{@code @Modifying} is required for any JPQL DELETE or UPDATE statement.
     * The outer {@code @Transactional} ensures the DELETE runs in its own transaction
     * even if invoked outside of an active one (the scheduler has no implicit transaction).
     *
     * @param now the current timestamp; all records with {@code expiresAt < now} are deleted
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM IdempotencyRecord r WHERE r.expiresAt < :now")
    void deleteExpired(@Param("now") LocalDateTime now);
}
