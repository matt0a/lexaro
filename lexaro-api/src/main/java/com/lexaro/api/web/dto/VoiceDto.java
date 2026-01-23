package com.lexaro.api.web.dto;

public record VoiceDto(
        String id,
        String title,
        String provider,   // "speechify" | "polly"
        String language,   // e.g., "US English", "Swiss German", "Canadian French"
        String region,     // 2-letter region like "US", "GB", "CH" ...
        String gender,     // "Male" | "Female" | "Other" | null
        String attitude,   // nullable
        String preview,    // preview audio URL (nullable)
        String avatar      // preview image URL (nullable)
) {}
