package com.lexaro.api.education.repo.dto;

import lombok.Builder;

import java.time.Instant;
import java.util.List;

/**
 * DTO representing a flashcard deck with its cards.
 */
@Builder
public record FlashcardDeckDto(
        Long id,
        Long docId,
        String title,
        Integer cardCount,
        List<FlashcardDto> cards,
        Instant createdAt
) {}
