package com.lexaro.api.education.repo;

import com.lexaro.api.education.domain.StudyTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repository for StudyTask entities.
 */
@Repository
public interface StudyTaskRepository extends JpaRepository<StudyTask, Long> {

    /**
     * Find a task by ID and verify user ownership through plan.
     */
    @Query("SELECT t FROM StudyTask t JOIN t.plan p WHERE t.id = :taskId AND p.userId = :userId")
    Optional<StudyTask> findByIdAndUserId(Long taskId, Long userId);

    /**
     * Find tasks for a date range.
     */
    @Query("SELECT t FROM StudyTask t JOIN t.plan p WHERE p.userId = :userId AND t.scheduledDate BETWEEN :start AND :end ORDER BY t.scheduledDate, t.id")
    List<StudyTask> findByUserIdAndDateRange(Long userId, LocalDate start, LocalDate end);

    /**
     * Find pending tasks for today and upcoming.
     */
    @Query("SELECT t FROM StudyTask t JOIN t.plan p WHERE p.userId = :userId AND p.status = 'active' AND t.status = 'pending' AND t.scheduledDate <= :date ORDER BY t.scheduledDate, t.id")
    List<StudyTask> findPendingTasksUpTo(Long userId, LocalDate date);
}
