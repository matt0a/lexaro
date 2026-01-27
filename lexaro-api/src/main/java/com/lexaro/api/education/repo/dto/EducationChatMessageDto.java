package com.lexaro.api.education.repo.dto;

/**
 * A single chat turn for conversation history.
 * role: "user" | "assistant" (case-insensitive; we normalize downstream)
 */
public record EducationChatMessageDto(
        String role,
        String content
) {}
