package com.lexaro.api.domain;

public enum DocumentPurpose {
    AUDIO,
    EDUCATION,
    BOTH;

    public static DocumentPurpose fromNullable(String raw) {
        if (raw == null || raw.isBlank()) return AUDIO;
        String up = raw.trim().toUpperCase();
        return switch (up) {
            case "AUDIO" -> AUDIO;
            case "EDUCATION" -> EDUCATION;
            case "BOTH" -> BOTH;
            default -> AUDIO;
        };
    }
}
