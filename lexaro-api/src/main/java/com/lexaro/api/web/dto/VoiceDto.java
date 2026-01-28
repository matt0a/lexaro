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
        String avatar,     // preview image URL (nullable)
        boolean favorite   // true if user has favorited this voice
) {
    /**
     * Create a VoiceDto without favorite status (defaults to false).
     */
    public VoiceDto(String id, String title, String provider, String language,
                    String region, String gender, String attitude, String preview, String avatar) {
        this(id, title, provider, language, region, gender, attitude, preview, avatar, false);
    }

    /**
     * Return a copy with updated favorite status.
     */
    public VoiceDto withFavorite(boolean favorite) {
        return new VoiceDto(id, title, provider, language, region, gender, attitude, preview, avatar, favorite);
    }
}
