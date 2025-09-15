package com.lexaro.api.web.dto;

public record PresignUploadRequest(
        String filename,
        String mime,
        long sizeBytes,
        Integer pages
) {}