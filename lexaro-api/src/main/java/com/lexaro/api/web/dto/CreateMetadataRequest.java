package com.lexaro.api.web.dto;

public record CreateMetadataRequest(
        String filename,
        String mime,
        long sizeBytes,
        Integer pages,
        String sha256
) {}