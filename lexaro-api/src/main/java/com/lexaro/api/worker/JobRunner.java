package com.lexaro.api.worker;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lexaro.api.domain.AudioStatus;
import com.lexaro.api.domain.Job;
import com.lexaro.api.domain.JobPayload;
import com.lexaro.api.repo.DocumentRepository;
import com.lexaro.api.service.DocumentAudioWorker;
import com.lexaro.api.service.JobService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Executor;

/**
 * Scheduled job runner that polls the {@code job} table and dispatches pending jobs
 * to the appropriate handler.
 *
 * <p>Polling uses {@link JobService#claimBatch} which issues an atomic
 * {@code UPDATE...FOR UPDATE SKIP LOCKED...RETURNING id} — safe for concurrent
 * runner instances on multiple JVM nodes.
 *
 * <p>Each claimed job is submitted to the {@code ttsExecutor} thread pool to avoid
 * blocking the scheduler thread during long-running TTS synthesis. The scheduler
 * thread only does the fast DB claim and task submission.
 *
 * <p>Stuck-job recovery runs every 60 seconds via a separate scheduled method.
 * A job is considered stuck if it has been in RUNNING state for longer than
 * {@code app.jobs.stuck-timeout-minutes} minutes (default: 10).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JobRunner {

    private final JobService jobService;
    private final DocumentAudioWorker audioWorker;
    private final DocumentRepository docs;
    private final ObjectMapper objectMapper;

    @Qualifier("ttsExecutor")
    private final Executor ttsExecutor;

    @Value("${app.jobs.batch-size:5}")
    private int batchSize;

    @Value("${app.jobs.stuck-timeout-minutes:10}")
    private int stuckTimeoutMinutes;

    /**
     * Unique identifier for this runner instance.
     * Used in {@code locked_by} to aid debugging of stuck-job scenarios.
     */
    private final String workerId = "runner-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);

    // ---- Scheduled methods ----

    /**
     * Main poll loop: claims PENDING jobs and submits them for async execution.
     *
     * <p>The scheduler thread is never blocked: each claimed job is immediately
     * handed off to {@code ttsExecutor}. The next poll runs {@code fixedDelay}
     * milliseconds after the current poll completes (not after the jobs finish).
     */
    @Scheduled(fixedDelayString = "${app.jobs.poll-interval-ms:3000}")
    public void poll() {
        try {
            List<Job> claimed = jobService.claimBatch(workerId, batchSize);
            for (Job job : claimed) {
                ttsExecutor.execute(() -> executeJob(job));
            }
        } catch (Exception e) {
            log.error("JobRunner.poll() error (workerId={}): {}", workerId, e.getMessage(), e);
        }
    }

    /**
     * Resets jobs that have been RUNNING for longer than the stuck timeout.
     * Runs every 60 seconds regardless of poll interval.
     */
    @Scheduled(fixedDelay = 60_000)
    public void resetStuck() {
        try {
            jobService.resetStuckJobs(Duration.ofMinutes(stuckTimeoutMinutes));
        } catch (Exception e) {
            log.error("JobRunner.resetStuck() error: {}", e.getMessage(), e);
        }
    }

    // ---- Execution ----

    /**
     * Dispatches a claimed job to the appropriate handler based on {@link Job#getType()}.
     *
     * <p>This method runs on the {@code ttsExecutor} thread pool. On any uncaught exception
     * the job is marked as retryable-failed so the retry backoff scheduler will reschedule it.
     *
     * @param job the claimed job (status is already RUNNING in the DB)
     */
    private void executeJob(Job job) {
        log.info("Executing job id={} type={} docId={} userId={} attempt={}",
                job.getId(), job.getType(), job.getDocId(), job.getUserId(), job.getAttempts());
        try {
            switch (job.getType()) {
                case "TTS" -> executeTtsJob(job);
                default -> {
                    log.warn("Unknown job type '{}' for job id={} — marking FAILED", job.getType(), job.getId());
                    jobService.markFailed(job.getId(), "Unknown job type: " + job.getType(), false);
                }
            }
        } catch (Exception e) {
            log.error("Unexpected error executing job id={}: {}", job.getId(), e.getMessage(), e);
            jobService.markFailed(job.getId(), "Unexpected error: " + e.getMessage(), true);
        }
    }

    /**
     * Executes a TTS job by delegating to {@link DocumentAudioWorker#process}.
     *
     * <p>{@code DocumentAudioWorker.process()} catches all exceptions internally
     * and persists the result ({@code READY} or {@code FAILED}) directly on the
     * {@link com.lexaro.api.domain.Document} entity. After it returns, this method
     * reads the document's {@code audioStatus} to determine whether the job succeeded.
     *
     * <p>If the job failed but still has retry budget, this method re-schedules the
     * job to PENDING and resets the document's {@code audioStatus} back to PROCESSING
     * so the user sees an accurate in-progress indicator during the retry window.
     *
     * @param job the claimed TTS job
     */
    private void executeTtsJob(Job job) {
        JobPayload params = parsePayload(job.getPayload());

        // The worker handles its own exception catching and persists READY/FAILED on the document.
        audioWorker.process(
                job.getUserId(),
                job.getDocId(),
                params.voice(),
                params.engine(),
                params.format(),
                params.unlimited(),
                params.targetLang()
        );

        // Read the document's audioStatus to determine the job outcome.
        // The worker sets READY on success, FAILED on any error.
        var docOpt = docs.findByIdAndUserId(job.getDocId(), job.getUserId());
        if (docOpt.isEmpty()) {
            // Document was deleted during processing — nothing to retry.
            log.warn("Document not found after TTS job id={} docId={} — marking job FAILED", job.getId(), job.getDocId());
            jobService.markFailed(job.getId(), "Document not found after processing", false);
            return;
        }

        var doc = docOpt.get();

        if (doc.getAudioStatus() == AudioStatus.READY) {
            jobService.markSucceeded(job.getId());
            log.info("TTS job id={} docId={} completed successfully", job.getId(), job.getDocId());
        } else {
            // TTS failed. Check if we should retry.
            boolean hasRetryBudget = job.getAttempts() < getMaxAttempts();

            if (hasRetryBudget) {
                // Reset document audioStatus to PROCESSING so the user sees "in progress"
                // rather than a misleading FAILED while the job is still in the retry queue.
                doc.setAudioStatus(AudioStatus.PROCESSING);
                doc.setAudioError(null);
                docs.save(doc);
                log.info("TTS job id={} docId={} failed; resetting to PROCESSING for retry (attempt {})",
                        job.getId(), job.getDocId(), job.getAttempts());
            }

            // markFailed will either reschedule (PENDING + backoff) or permanently set FAILED.
            jobService.markFailed(job.getId(), doc.getAudioError(), hasRetryBudget);
        }
    }

    @Value("${app.jobs.max-attempts:5}")
    private int maxAttemptsValue;

    /**
     * Returns the configured max-attempts to avoid a Spring EL self-reference
     * inside the private executeTtsJob method.
     */
    private int getMaxAttempts() {
        return maxAttemptsValue;
    }

    /**
     * Deserializes the job payload JSON into a {@link JobPayload}.
     * Returns safe defaults if the payload is null or malformed.
     */
    private JobPayload parsePayload(String payload) {
        if (payload == null || payload.isBlank()) {
            return new JobPayload(null, null, "mp3", false, null);
        }
        try {
            return objectMapper.readValue(payload, JobPayload.class);
        } catch (Exception e) {
            log.warn("Failed to parse job payload '{}': {} — using defaults", payload, e.getMessage());
            return new JobPayload(null, null, "mp3", false, null);
        }
    }
}
