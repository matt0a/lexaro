package com.lexaro.api.education.web;

import com.lexaro.api.education.repo.dto.FlashcardDeckDto;
import com.lexaro.api.education.repo.dto.GenerateFlashcardsRequest;
import com.lexaro.api.education.service.FlashcardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for flashcard operations.
 * Handles flashcard deck generation, retrieval, and deletion.
 */
@RestController
@RequestMapping("/education")
@RequiredArgsConstructor
public class FlashcardController {

    private final FlashcardService flashcardService;

    /**
     * Get the current user's ID from the security context.
     */
    private long userId() {
        return (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    /**
     * Generate a new flashcard deck from document content.
     *
     * @param docId   the document ID
     * @param request generation parameters (card count, page range)
     * @return the generated flashcard deck
     */
    @PostMapping("/documents/{docId}/flashcards/generate")
    public FlashcardDeckDto generateFlashcards(
            @PathVariable Long docId,
            @RequestBody(required = false) GenerateFlashcardsRequest request
    ) {
        if (request == null) {
            request = new GenerateFlashcardsRequest(null, null, null);
        }
        return flashcardService.generateFlashcards(userId(), docId, request);
    }

    /**
     * Get all flashcard decks for a document.
     *
     * @param docId the document ID
     * @return list of flashcard decks
     */
    @GetMapping("/documents/{docId}/flashcards")
    public List<FlashcardDeckDto> getDecksForDocument(@PathVariable Long docId) {
        return flashcardService.getDecksForDocument(userId(), docId);
    }

    /**
     * Get a specific flashcard deck by ID.
     *
     * @param deckId the deck ID
     * @return the flashcard deck with all cards
     */
    @GetMapping("/flashcards/{deckId}")
    public FlashcardDeckDto getDeck(@PathVariable Long deckId) {
        return flashcardService.getDeck(userId(), deckId);
    }

    /**
     * Delete a flashcard deck.
     *
     * @param deckId the deck ID
     */
    @DeleteMapping("/flashcards/{deckId}")
    public void deleteDeck(@PathVariable Long deckId) {
        flashcardService.deleteDeck(userId(), deckId);
    }
}
