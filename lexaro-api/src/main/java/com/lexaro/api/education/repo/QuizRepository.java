package com.lexaro.api.education.repo;

import com.lexaro.api.education.domain.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Quiz entities.
 * Provides methods to find quizzes by document and user.
 */
@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {

    /**
     * Find all quizzes for a document, ordered by creation date descending.
     */
    List<Quiz> findByDocIdOrderByCreatedAtDesc(Long docId);

    /**
     * Find all quizzes for a user, ordered by creation date descending.
     */
    List<Quiz> findByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * Find a quiz by ID and user ID (ownership check).
     */
    Optional<Quiz> findByIdAndUserId(Long id, Long userId);

    /**
     * Find a quiz by ID and user ID with questions eagerly loaded.
     */
    @Query("SELECT q FROM Quiz q LEFT JOIN FETCH q.questions WHERE q.id = :id AND q.userId = :userId")
    Optional<Quiz> findByIdAndUserIdWithQuestions(@Param("id") Long id, @Param("userId") Long userId);

    /**
     * Find quizzes by document ID and user ID.
     */
    List<Quiz> findByDocIdAndUserIdOrderByCreatedAtDesc(Long docId, Long userId);

    /**
     * Count quizzes for a document.
     */
    long countByDocId(Long docId);
}
