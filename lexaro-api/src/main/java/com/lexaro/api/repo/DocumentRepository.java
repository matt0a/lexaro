package com.lexaro.api.repo;

import com.lexaro.api.domain.AudioStatus;
import com.lexaro.api.domain.Document;
import com.lexaro.api.domain.DocumentPurpose;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface DocumentRepository extends JpaRepository<Document, Long> {
    Page<Document> findByUserIdAndDeletedAtIsNull(Long userId, Pageable pageable);
    Optional<Document> findByIdAndUserIdAndDeletedAtIsNull(Long id, Long userId);
    List<Document> findTop100ByExpiresAtIsNotNullAndExpiresAtBeforeAndDeletedAtIsNull(Instant cutoff);
    @EntityGraph(attributePaths = "user")
    Optional<Document> findByIdAndUserId(Long id, Long userId);
    long countByUserIdAndAudioStatus(Long userId, AudioStatus status);

    /**
     * Returns the total number of documents across all users with the given audio status.
     *
     * <p>Used by {@link com.lexaro.api.config.MetricsConfig} to populate the
     * {@code tts.jobs.pending} Gauge at Prometheus scrape time. Spring Data JPA derives
     * a single {@code SELECT COUNT(*) WHERE audio_status = ?} from this method signature.
     *
     * @param audioStatus the status to count (e.g. {@link AudioStatus#PROCESSING})
     * @return count of matching documents
     */
    long countByAudioStatus(AudioStatus audioStatus);
    /**
     * Atomically transitions {@code audio_status} to {@code PROCESSING} only when the
     * current status is {@code NONE} or {@code FAILED}.
     *
     * <p>This is a conditional UPDATE rather than a read-then-write, which prevents a
     * TOCTOU race where two concurrent requests both observe {@code NONE} and both
     * dispatch audio jobs. Only the request that executes this UPDATE first will see
     * a return value of {@code 1}; all others will see {@code 0} because the row's
     * status will already be {@code PROCESSING}.
     *
     * <p>The {@code @Modifying} annotation is required for any JPQL UPDATE statement.
     * The outer {@code @Transactional} ensures the UPDATE is committed even when this
     * method is called from a non-transactional context (though callers should generally
     * wrap the full start sequence in one transaction).
     *
     * @param id the document ID to claim
     * @return 1 if the UPDATE was applied (slot claimed), 0 if the status was not eligible
     */
    @Modifying
    @Transactional
    @Query("UPDATE Document d SET d.audioStatus = com.lexaro.api.domain.AudioStatus.PROCESSING " +
           "WHERE d.id = :id AND d.audioStatus IN " +
           "(com.lexaro.api.domain.AudioStatus.NONE, com.lexaro.api.domain.AudioStatus.FAILED)")
    int claimAudioProcessing(@Param("id") Long id);

    @Override
    void flush();
    Page<Document> findByUserIdAndDeletedAtIsNullAndPurposeIn(
            Long userId,
            Collection<DocumentPurpose> purposes,
            Pageable pageable
    );

}
