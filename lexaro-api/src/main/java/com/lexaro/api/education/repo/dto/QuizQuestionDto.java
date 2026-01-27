package com.lexaro.api.education.repo.dto;

import lombok.Builder;

import java.util.List;

/**
 * DTO representing a quiz question.
 * Note: answerIndex and explanation are only included after grading or when reviewing.
 */
@Builder
public record QuizQuestionDto(
        Long id,
        int questionIndex,
        String questionType,
        String prompt,
        List<String> choices,
        Integer answerIndex,      // null when taking quiz, populated after grading
        String explanation        // null when taking quiz, populated after grading
) {}
