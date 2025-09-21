package com.lexaro.api.web.dto;

import java.time.Instant;

public record DocumentTextResponse(
        Long documentId,
        String mime,
        int charCount,
        boolean truncated,   // true if text likely cut by plan cap
        Instant extractedAt,
        String text
) {}
