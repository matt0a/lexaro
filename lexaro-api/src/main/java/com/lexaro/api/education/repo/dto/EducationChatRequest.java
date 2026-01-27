package com.lexaro.api.education.repo.dto;

import java.util.List;

/**
 * Chat request for the Education assistant.
 *
 * message: required user prompt
 * docId: optional - if present, we can retrieve chunks from that document
 * history: optional last messages to preserve conversation context
 */
public record EducationChatRequest(
        String message,
        Long docId,
        List<EducationChatMessageDto> history
) {}
