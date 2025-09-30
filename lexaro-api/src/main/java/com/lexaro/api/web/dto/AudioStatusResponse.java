package com.lexaro.api.web.dto;

public record AudioStatusResponse(
        String status,
        String error,
        String voice,
        String format,
        String downloadUrl

) {}

