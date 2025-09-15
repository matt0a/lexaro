package com.lexaro.api.web.dto;

public record CompleteUploadRequest(
        String sha256 // optional; if provided we’ll store/verify
) {}