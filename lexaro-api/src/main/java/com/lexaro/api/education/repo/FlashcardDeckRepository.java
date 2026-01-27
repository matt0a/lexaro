package com.lexaro.api.education.repo;

import com.lexaro.api.education.domain.FlashcardDeck;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for FlashcardDeck entities.
 */
@Repository
public interface FlashcardDeckRepository extends JpaRepository<FlashcardDeck, Long> {

    /**
     * Find all flashcard decks for a document, ordered by creation date descending.
     */
    List<FlashcardDeck> findByDocIdOrderByCreatedAtDesc(Long docId);

    /**
     * Find all flashcard decks for a document and user.
     */
    List<FlashcardDeck> findByDocIdAndUserIdOrderByCreatedAtDesc(Long docId, Long userId);

    /**
     * Find a deck by ID and user ID (ownership check).
     */
    Optional<FlashcardDeck> findByIdAndUserId(Long id, Long userId);

    /**
     * Count decks for a document.
     */
    long countByDocId(Long docId);
}
