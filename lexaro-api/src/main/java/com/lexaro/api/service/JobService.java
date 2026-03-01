package com.lexaro.api.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lexaro.api.domain.Job;
import com.lexaro.api.domain.JobPayload;
import com.lexaro.api.repo.JobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Manages the durable job queue.
 *
 * <p>Enqueue is idempotent: if a job for the given (doc_id, type) is already
 * PENDING or RUNNING, the unique partial index {@code idx_job_active_dedup}
 * raises a {@link DataIntegrityViolationException}, which this service catches
 * and treats as "already enqueued" — returning the existing job without creating
 * a duplicate.
 *
 * <p>Claim uses an atomic {@code UPDATE...FOR UPDATE SKIP LOCKED...RETURNING id}
 * via JdbcTemplate to prevent two runner instances from claiming the same job.
 * This is safe for horizontal-scale deployments with multiple API instances.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobs;
    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper;

    @Value("${app.jobs.base-retry-seconds:10}")
    private int baseRetrySeconds;

    @Value("${app.jobs.max-retry-seconds:300}")
    private int maxRetrySeconds;

    @Value("${app.jobs.max-attempts:5}")
    private int maxAttempts;

    // ---- Enqueue ----

    /**
     * Enqueues a new job, or returns the existing active job if one already exists
     * for the same {@code (docId, type)} pair (idempotent enqueue).
     *
     * <p>The unique partial index {@code idx_job_active_dedup} prevents duplicate active
     * jobs at the DB level. If the INSERT violates the constraint, this method catches
     * the exception and returns the existing PENDING or RUNNING job instead.
     *
     * @param userId  the owning user's ID
     * @param docId   the target document ID
     * @param type    job type discriminator (e.g. "TTS")
     * @param payload job-specific parameters (serialized to JSON); may be null
     * @return the newly created or existing active job
     */
    @Transactional
    public Job enqueue(Long userId, Long docId, String type, Object payload) {
        String payloadJson = serializePayload(payload);
        Instant now = Instant.now();

        Job job = Job.builder()
                .type(type)
                .userId(userId)
                .docId(docId)
                .status("PENDING")
                .payload(payloadJson)
                .attempts(0)
                .nextRunAt(now)
                .createdAt(now)
                .updatedAt(now)
                .build();

        try {
            Job saved = jobs.save(job);
            log.debug("Enqueued job id={} type={} docId={} userId={}", saved.getId(), type, docId, userId);
            return saved;
        } catch (DataIntegrityViolationException e) {
            // Unique partial index violation: a PENDING or RUNNING job already exists.
            // This is the idempotent path — return the existing active job.
            log.debug("Job for docId={} type={} already active — skipping duplicate enqueue", docId, type);
            return jobs.findFirstByDocIdAndTypeAndStatusIn(docId, type, List.of("PENDING", "RUNNING"))
                    .orElseGet(() -> {
                        // Extremely unlikely: constraint fired but job not found (race between
                        // the failing INSERT and a concurrent SUCCEEDED/FAILED transition).
                        // Return an unsaved stub so callers don't crash.
                        log.warn("Could not find active job for docId={} type={} after constraint violation", docId, type);
                        return job;
                    });
        }
    }

    // ---- Claim ----

    /**
     * Atomically claims up to {@code limit} PENDING jobs whose {@code next_run_at} is
     * in the past. Sets their status to RUNNING and increments the attempt counter.
     *
     * <p>Uses {@code FOR UPDATE SKIP LOCKED} so that concurrent runner instances on
     * different JVM nodes never claim the same row. Must be called inside a
     * {@code @Transactional} method; the lock is released when the transaction commits.
     *
     * <p>The claim is implemented via {@link JdbcTemplate#execute} with a
     * {@code PreparedStatementCallback} because Spring Data JPA does not support
     * {@code @Modifying} queries that also return rows via {@code RETURNING *}.
     *
     * @param workerId a unique identifier for this runner instance (used for debugging)
     * @param limit    maximum number of jobs to claim in one poll cycle
     * @return the claimed {@link Job} entities (may be empty if no work is available)
     */
    @Transactional
    public List<Job> claimBatch(String workerId, int limit) {
        final String sql = """
                UPDATE job
                SET    status    = 'RUNNING',
                       locked_at = NOW(),
                       locked_by = ?,
                       attempts  = attempts + 1,
                       updated_at = NOW()
                WHERE  id IN (
                    SELECT id
                    FROM   job
                    WHERE  status = 'PENDING'
                      AND  next_run_at <= NOW()
                    ORDER BY next_run_at
                    LIMIT  ?
                    FOR UPDATE SKIP LOCKED
                )
                RETURNING id
                """;

        // Use explicit PreparedStatementCallback so PostgreSQL's RETURNING clause
        // is processed as a ResultSet (not discarded as a plain UPDATE row count).
        List<Long> ids = jdbc.execute((Connection con) -> {
            try (PreparedStatement ps = con.prepareStatement(sql)) {
                ps.setString(1, workerId);
                ps.setInt(2, limit);
                List<Long> result = new ArrayList<>();
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        result.add(rs.getLong("id"));
                    }
                }
                return result;
            }
        });

        if (ids == null || ids.isEmpty()) {
            return List.of();
        }

        List<Job> claimed = jobs.findAllById(ids);
        log.debug("Claimed {} jobs (workerId={})", claimed.size(), workerId);
        return claimed;
    }

    // ---- Terminal state transitions ----

    /**
     * Marks the job as successfully completed.
     *
     * @param jobId the job ID to update
     */
    @Transactional
    public void markSucceeded(Long jobId) {
        jobs.findById(jobId).ifPresent(j -> {
            j.setStatus("SUCCEEDED");
            j.setLockedAt(null);
            j.setLockedBy(null);
            j.setError(null);
            j.setUpdatedAt(Instant.now());
            jobs.save(j);
            log.debug("Job {} SUCCEEDED", jobId);
        });
    }

    /**
     * Marks the job as failed, scheduling a retry if eligible.
     *
     * <p>If {@code retryable} is true and {@code job.attempts < maxAttempts}, the job
     * is reset to PENDING with an exponential {@code next_run_at} delay. Otherwise,
     * the job is permanently set to FAILED.
     *
     * <p>Retry delay: {@code min(baseRetrySeconds * 2^attempts, maxRetrySeconds)}.
     *
     * @param jobId     the job ID to update
     * @param error     human-readable error description (truncated to 2000 chars)
     * @param retryable whether this failure type should be retried
     */
    @Transactional
    public void markFailed(Long jobId, String error, boolean retryable) {
        jobs.findById(jobId).ifPresent(j -> {
            String truncated = error == null ? null
                    : error.substring(0, Math.min(2000, error.length()));
            j.setError(truncated);
            j.setUpdatedAt(Instant.now());

            if (retryable && j.getAttempts() < maxAttempts) {
                // Exponential backoff: 10s, 20s, 40s, 80s, 160s (capped at maxRetrySeconds)
                long delaySecs = Math.min(
                        (long) baseRetrySeconds * (1L << j.getAttempts()),
                        maxRetrySeconds
                );
                j.setStatus("PENDING");
                j.setNextRunAt(Instant.now().plusSeconds(delaySecs));
                j.setLockedAt(null);
                j.setLockedBy(null);
                log.debug("Job {} scheduled for retry in {}s (attempt {})", jobId, delaySecs, j.getAttempts());
            } else {
                j.setStatus("FAILED");
                log.warn("Job {} permanently FAILED after {} attempt(s): {}", jobId, j.getAttempts(), truncated);
            }
            jobs.save(j);
        });
    }

    // ---- Stuck-job recovery ----

    /**
     * Resets RUNNING jobs whose {@code locked_at} is older than {@code stuckTimeout}
     * back to PENDING so they can be re-claimed after an API restart or crash.
     *
     * <p>A job is considered "stuck" if it has been in RUNNING state for longer than
     * {@code stuckTimeout} without completing. This recovers from JVM crashes or
     * network partitions where the runner never reported a terminal state.
     *
     * @param stuckTimeout age threshold; jobs older than this are reset
     */
    @Transactional
    public void resetStuckJobs(Duration stuckTimeout) {
        Instant cutoff = Instant.now().minus(stuckTimeout);
        final String sql = """
                UPDATE job
                SET    status     = 'PENDING',
                       locked_at  = NULL,
                       locked_by  = NULL,
                       next_run_at = NOW(),
                       updated_at  = NOW()
                WHERE  status     = 'RUNNING'
                  AND  locked_at  < ?
                """;
        int reset = jdbc.update(sql, java.sql.Timestamp.from(cutoff));
        if (reset > 0) {
            log.warn("Reset {} stuck job(s) locked before {}", reset, cutoff);
        }
    }

    // ---- Helpers ----

    private String serializePayload(Object payload) {
        if (payload == null) return null;
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Cannot serialize job payload: " + e.getMessage(), e);
        }
    }
}
