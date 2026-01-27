package com.lexaro.api.education.repo.dto;

/**
 * Request for generating a quiz from document content.
 *
 * @param questionCount number of questions to generate (default: 5, max: 20)
 * @param difficulty    difficulty level: "easy", "medium", "hard" (default: "medium")
 * @param pageStart     optional: only use content from this page onwards
 * @param pageEnd       optional: only use content up to this page
 */
public record GenerateQuizRequest(
        Integer questionCount,
        String difficulty,
        Integer pageStart,
        Integer pageEnd
) {
    /**
     * Returns the question count, defaulting to 5 if not specified.
     */
    public int questionCountOrDefault() {
        if (questionCount == null || questionCount <= 0) return 5;
        return Math.min(questionCount, 20);
    }

    /**
     * Returns the difficulty, defaulting to "medium" if not specified.
     */
    public String difficultyOrDefault() {
        if (difficulty == null || difficulty.isBlank()) return "medium";
        return difficulty.toLowerCase();
    }
}
