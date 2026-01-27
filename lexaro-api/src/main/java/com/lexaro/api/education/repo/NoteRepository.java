package com.lexaro.api.education.repo;

import com.lexaro.api.education.domain.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Note entities.
 */
@Repository
public interface NoteRepository extends JpaRepository<Note, Long> {

    /**
     * Find all notes for a document, ordered by creation date descending.
     */
    List<Note> findByDocIdOrderByCreatedAtDesc(Long docId);

    /**
     * Find all notes for a document and user.
     */
    List<Note> findByDocIdAndUserIdOrderByCreatedAtDesc(Long docId, Long userId);

    /**
     * Find a note by ID and user ID (ownership check).
     */
    Optional<Note> findByIdAndUserId(Long id, Long userId);

    /**
     * Find notes by document, user, and style.
     */
    List<Note> findByDocIdAndUserIdAndStyleOrderByCreatedAtDesc(Long docId, Long userId, String style);

    /**
     * Count notes for a document.
     */
    long countByDocId(Long docId);
}
