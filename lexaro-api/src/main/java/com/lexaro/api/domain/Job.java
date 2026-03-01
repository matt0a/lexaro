package com.lexaro.api.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

/**
 * JPA entity representing a durable async job (TTS, OCR, INDEX).
 *
 * <p>Status lifecycle: PENDING → RUNNING → SUCCEEDED | FAILED.
 * Failed jobs may be reset back to PENDING for retry (up to max attempts).
 *
 * <p>The unique partial index {@code idx_job_active_dedup} on {@code (doc_id, type)}
 * WHERE {@code status IN ('PENDING','RUNNING')} enforces that only one active job
 * per document+type can exist at any time. Attempting to insert a second row will
 * throw {@link org.springframework.dao.DataIntegrityViolationException}, which
 * {@link com.lexaro.api.service.JobService#enqueue} catches and treats as idempotent.
 */
@Entity
@Table(name = "job")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Job type discriminator (e.g. "TTS", "OCR", "INDEX"). */
    @Column(nullable = false, length = 32)
    private String type;

    /** Owner user ID (denormalised for fast polling queries). */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** Target document ID. */
    @Column(name = "doc_id", nullable = false)
    private Long docId;

    /**
     * Current lifecycle status: PENDING, RUNNING, SUCCEEDED, FAILED.
     * Stored as a plain VARCHAR — not an enum — so the DB schema is not coupled
     * to the Java enum and new status values can be added without a migration.
     */
    @Column(nullable = false, length = 16)
    @Builder.Default
    private String status = "PENDING";

    /**
     * JSON-serialized job-type-specific parameters (e.g. voice, engine, format).
     * Nullable: some job types may not require additional parameters.
     */
    @Column(columnDefinition = "text")
    private String payload;

    /** Number of execution attempts so far (incremented by {@code claimBatch}). */
    @Column(nullable = false)
    @Builder.Default
    private int attempts = 0;

    /**
     * Earliest time at which this job may be claimed.
     * Starts at NOW(); increased exponentially on each retry.
     */
    @Column(name = "next_run_at", nullable = false)
    @Builder.Default
    private Instant nextRunAt = Instant.now();

    /** Wall-clock time when this job was last claimed by a runner instance. */
    @Column(name = "locked_at")
    private Instant lockedAt;

    /** Identifier of the runner instance that currently holds the lock. */
    @Column(name = "locked_by", length = 64)
    private String lockedBy;

    /** Last error message (truncated to 2000 chars). Null on success. */
    @Column(columnDefinition = "text")
    private String error;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();
}
