package com.lexaro.api.education.repo.dto;

import lombok.Builder;

import java.time.Instant;

/**
 * DTO representing a note.
 */
@Builder
public record NoteDto(
        Long id,
        Long docId,
        String title,
        String style,
        String content,
        Integer pageStart,
        Integer pageEnd,
        Instant createdAt
) {}
