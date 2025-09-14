package com.lexaro.api.web.dto;

import java.time.Instant;

public record DocumentResponse(
        Long id,
        String filename,
        String mime,
        long sizeBytes,
        Integer pages,
        String status,
        Instant uploadedAt,
        Instant expiresAt,
        String planAtUpload
) {}
