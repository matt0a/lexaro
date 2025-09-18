package com.lexaro.api.web.dto;

import java.util.Map;

public record PresignDownloadResponse(
        Long id,
        String objectKey,
        String url,
        Map<String, String> headers,
        int expiresInSeconds
) {}
