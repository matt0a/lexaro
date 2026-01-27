package com.lexaro.api.education.service;

import com.lexaro.api.education.repo.dto.FlashcardDeckDto;
import com.lexaro.api.education.repo.dto.GenerateFlashcardsRequest;

import java.util.List;

/**
 * Service for flashcard generation and management.
 */
public interface FlashcardService {

    /**
     * Generate flashcards from document content using AI.
     *
     * @param userId  the user requesting the flashcards
     * @param docId   the document to generate flashcards from
     * @param request generation parameters (card count, page range)
     * @return the generated flashcard deck
     */
    FlashcardDeckDto generateFlashcards(long userId, long docId, GenerateFlashcardsRequest request);

    /**
     * Get all flashcard decks for a document.
     *
     * @param userId the user ID (for ownership check)
     * @param docId  the document ID
     * @return list of flashcard decks
     */
    List<FlashcardDeckDto> getDecksForDocument(long userId, long docId);

    /**
     * Get a specific flashcard deck by ID.
     *
     * @param userId the user ID (for ownership check)
     * @param deckId the deck ID
     * @return the flashcard deck
     */
    FlashcardDeckDto getDeck(long userId, long deckId);

    /**
     * Delete a flashcard deck.
     *
     * @param userId the user ID (for ownership check)
     * @param deckId the deck ID
     */
    void deleteDeck(long userId, long deckId);
}
