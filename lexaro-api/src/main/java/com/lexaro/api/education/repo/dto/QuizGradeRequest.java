package com.lexaro.api.education.repo.dto;

import java.util.Map;

/**
 * Request for grading a quiz attempt.
 *
 * @param answers map of questionId -> selected answer index
 */
public record QuizGradeRequest(
        Map<Long, Integer> answers
) {}
