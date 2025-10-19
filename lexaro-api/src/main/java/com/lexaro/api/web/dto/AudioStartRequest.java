package com.lexaro.api.web.dto;

/**
 * targetLang is accepted for backward compatibility but IGNORED while
 * app.translate.enabled=false. The backend always reads the original text.
 */
public record AudioStartRequest(
        String voice,
        String voice_id,
        String engine,
        String format,
        String targetLang, // ignored when translation is disabled
        Boolean unlimited
) {}
