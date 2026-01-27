package com.lexaro.api.education.repo.dto;

/**
 * A single retrieved source reference (chunk) used to ground an answer.
 */
public record EducationChatSourceDto(
        Long chunkId,
        Integer pageStart,
        Integer pageEnd,
        Double score,
        String snippet,
        Integer chunkIndex
) {}
