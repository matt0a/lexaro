package com.lexaro.api.education.repo.dto;

import lombok.Builder;

/**
 * DTO representing a single flashcard.
 */
@Builder
public record FlashcardDto(
        Long id,
        Integer cardIndex,
        String front,
        String back
) {}
