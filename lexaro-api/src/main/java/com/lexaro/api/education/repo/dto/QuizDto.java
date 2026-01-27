package com.lexaro.api.education.repo.dto;

import lombok.Builder;

import java.time.Instant;
import java.util.List;

/**
 * DTO representing a quiz with its questions.
 */
@Builder
public record QuizDto(
        Long id,
        Long docId,
        String title,
        int questionCount,
        List<QuizQuestionDto> questions,
        Instant createdAt
) {}
