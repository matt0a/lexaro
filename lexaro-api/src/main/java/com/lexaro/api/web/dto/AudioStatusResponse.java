package com.lexaro.api.web.dto;

public record AudioStatusResponse(
        String status,
        String voice,
        String format,
        String downloadUrl,
        String error
) {}
