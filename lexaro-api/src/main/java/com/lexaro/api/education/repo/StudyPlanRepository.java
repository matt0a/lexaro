package com.lexaro.api.education.repo;

import com.lexaro.api.education.domain.StudyPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for StudyPlan entities.
 */
@Repository
public interface StudyPlanRepository extends JpaRepository<StudyPlan, Long> {

    /**
     * Find all study plans for a user, ordered by creation date descending.
     */
    List<StudyPlan> findByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * Find active study plans for a user.
     */
    List<StudyPlan> findByUserIdAndStatusOrderByExamDateAsc(Long userId, String status);

    /**
     * Find a plan by ID and user ID (ownership check).
     */
    Optional<StudyPlan> findByIdAndUserId(Long id, Long userId);

    /**
     * Count active plans for a user.
     */
    long countByUserIdAndStatus(Long userId, String status);
}
