package com.lexaro.api.web.support;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Utility for generating stable ETags from resource content.
 *
 * ETags are built from a deterministic, sorted canonical string and SHA-256 hashed.
 * This ensures the same ETag for the same logical resource content regardless of list
 * ordering or JVM identity hash codes.
 *
 * NEVER use Object.hashCode() for ETags — it is not stable across JVM restarts.
 *
 * <p>Java 17+ {@link HexFormat} is used for hex encoding; no external dependencies needed.
 */
public final class ETagHelper {

    /** Utility class — no instantiation. */
    private ETagHelper() {}

    /**
     * Generates a stable ETag for a list of voice DTOs.
     *
     * <p>The canonical form is: all voices sorted by (voiceId, provider) then joined as
     * {@code "voiceId:provider"} pairs separated by commas. Only these two fields are
     * included because they uniquely identify a voice entry in the catalog. The final
     * string is SHA-256 hashed and wrapped in double-quotes as required by RFC 7232.
     *
     * <p>Because {@link VoiceDto} is a Java record, its component accessors have no
     * {@code get} prefix — the callers must pass {@code VoiceDto::id} and
     * {@code VoiceDto::provider} (not {@code VoiceDto::getId}).
     *
     * @param <T>         the DTO type
     * @param voices      list of voice DTOs (may be in any order)
     * @param getId       function to extract the voice's unique ID
     * @param getProvider function to extract the voice's provider name
     * @return a quoted ETag string suitable for the {@code ETag} response header,
     *         e.g. {@code "\"a3f1bc2d...\""}
     */
    public static <T> String fromVoices(
            List<T> voices,
            Function<T, String> getId,
            Function<T, String> getProvider) {

        // Build a deterministic canonical string from sorted (id, provider) pairs
        String canonical = voices.stream()
                .sorted(Comparator
                        .comparing(getId, Comparator.nullsFirst(String::compareTo))
                        .thenComparing(getProvider, Comparator.nullsFirst(String::compareTo)))
                .map(v -> getId.apply(v) + ":" + getProvider.apply(v))
                .collect(Collectors.joining(","));

        // Wrap the hex digest in double-quotes as required by RFC 7232
        return "\"" + sha256Hex(canonical) + "\"";
    }

    /**
     * Returns the lowercase hex-encoded SHA-256 digest of the given input string
     * encoded as UTF-8.
     *
     * @param input the string to hash; must not be null
     * @return 64-character lowercase hex string
     * @throws IllegalStateException if the JVM does not provide SHA-256 (should never happen)
     */
    public static String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            // HexFormat is available since Java 17 — no Guava or Apache Commons needed
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available on this JVM", e);
        }
    }
}
