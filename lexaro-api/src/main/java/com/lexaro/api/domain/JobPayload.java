package com.lexaro.api.domain;

/**
 * JSON-serializable parameters for a TTS job.
 *
 * <p>Stored in {@link Job#payload} as a JSON string so the job runner can
 * reconstruct all parameters needed to execute the audio synthesis without
 * an extra document lookup beyond what is already done for ownership/status checks.
 */
public record JobPayload(
        /** TTS voice ID (e.g. "Joanna", "kristy"). Null = plan default. */
        String voice,
        /** TTS engine (e.g. "standard", "neural"). Null = plan default. */
        String engine,
        /** Output format (e.g. "mp3", "ogg"). Null = "mp3". */
        String format,
        /** True if the user is on an unlimited allowlist — bypasses quota recording. */
        boolean unlimited,
        /** Target language for translation, or null if translation is disabled. */
        String targetLang
) {}
