package com.lexaro.api.web.dto;

public record AudioStartRequest(
        String voice,
        String voice_id,
        String engine,
        String format,
        String targetLang,
        Boolean unlimited
) {}
