package com.lexaro.api.education.repo.dto;

/**
 * Request for generating flashcards from document content.
 *
 * @param cardCount number of flashcards to generate (default: 10, max: 30)
 * @param pageStart optional: only use content from this page onwards
 * @param pageEnd   optional: only use content up to this page
 */
public record GenerateFlashcardsRequest(
        Integer cardCount,
        Integer pageStart,
        Integer pageEnd
) {
    /**
     * Returns the card count, defaulting to 10 if not specified.
     * Clamped between 5 and 30.
     */
    public int cardCountOrDefault() {
        if (cardCount == null) return 10;
        return Math.max(5, Math.min(30, cardCount));
    }
}
