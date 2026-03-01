package com.lexaro.api.repo;

import com.lexaro.api.domain.Job;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for {@link Job} entities.
 *
 * <p>Claim-and-lock operations use JdbcTemplate directly in
 * {@link com.lexaro.api.service.JobService} because the
 * {@code UPDATE...FOR UPDATE SKIP LOCKED...RETURNING id} pattern
 * requires explicit JDBC access that Spring Data cannot derive from method names.
 */
public interface JobRepository extends JpaRepository<Job, Long> {

    /**
     * Returns the first active (PENDING or RUNNING) job for the given document and type.
     * Used by {@link com.lexaro.api.service.JobService#enqueue} to return an existing job
     * when the unique partial index prevents a duplicate insert.
     *
     * @param docId   target document ID
     * @param type    job type (e.g. "TTS")
     * @param statuses list of active status values (typically ["PENDING","RUNNING"])
     * @return the existing active job, if present
     */
    Optional<Job> findFirstByDocIdAndTypeAndStatusIn(Long docId, String type, List<String> statuses);
}
