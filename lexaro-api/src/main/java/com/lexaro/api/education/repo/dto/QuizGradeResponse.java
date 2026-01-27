package com.lexaro.api.education.repo.dto;

import lombok.Builder;

import java.util.List;

/**
 * Response after grading a quiz attempt.
 */
@Builder
public record QuizGradeResponse(
        Long quizId,
        int totalQuestions,
        int correctCount,
        int incorrectCount,
        double scorePercent,
        List<QuestionResult> results,
        List<String> weakTopics
) {
    /**
     * Result for a single question.
     */
    @Builder
    public record QuestionResult(
            Long questionId,
            int questionIndex,
            String prompt,
            List<String> choices,
            int correctAnswerIndex,
            Integer userAnswerIndex,
            boolean correct,
            String explanation
    ) {}
}
