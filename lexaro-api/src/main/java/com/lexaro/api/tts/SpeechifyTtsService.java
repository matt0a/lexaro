package com.lexaro.api.tts;

import com.lexaro.api.domain.Plan;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.util.MimeTypeUtils;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.Base64;
import java.util.UUID;

@RequiredArgsConstructor
public class SpeechifyTtsService implements TtsService {

    private final String baseUrl;
    private final String apiKey;
    private final WebClient client;
    private final Duration timeout;
    private final String defaultVoice;

    private static final List<String> PATHS = List.of(
            "/v1/audio/speech",
            "/v1/text-to-speech",
            "/v1/tts"
    );

    @Override
    public byte[] synthesize(Plan plan,
                             String text,
                             String voice,
                             String engine,
                             String format,
                             String language) {

        final String voiceId = isBlank(voice) ? defaultVoice : voice.trim();
        final String fmt = isBlank(format) ? "mp3" : format.trim().toLowerCase();

        RuntimeException last404or405 = null;
        List<String> tried = new ArrayList<>();

        for (String path : PATHS) {
            final String uri = joinUrl(baseUrl, path);
            tried.add(uri);

            try {
                if ("/v1/audio/speech".equals(path)) {
                    return callModern(uri, text, voiceId, fmt);
                } else {
                    return callLegacy(uri, text, voiceId, fmt, engine, language);
                }
            } catch (WebClientResponseException wce) {
                int code = wce.getStatusCode().value();
                if (code == 404 || code == 405) {
                    last404or405 = rewrap(code + " at " + uri + " (voice_id=" + voiceId + ")", wce);
                    continue;
                }
                String body = trimForLog(wce.getResponseBodyAsString(StandardCharsets.UTF_8), 800);
                throw rewrap("Speechify TTS failed: HTTP " + code + (isBlank(body) ? "" : " – " + body), wce);
            }
        }

        if (last404or405 != null) {
            throw new RuntimeException(
                    "Speechify TTS failed: no matching endpoint (tried " + String.join(", ", tried) + ")",
                    last404or405
            );
        }
        throw new RuntimeException("Speechify TTS failed: no valid endpoint produced audio");
    }

    /* ---------- Modern ---------- */
    private byte[] callModern(String uri, String text, String voiceId, String audioFormat) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("input", text);
        payload.put("voice_id", voiceId);
        payload.put("audio_format", audioFormat);

        String idempotency = UUID.nameUUIDFromBytes((voiceId + "|" + audioFormat + "|" + text)
                .getBytes(StandardCharsets.UTF_8)).toString();

        return client.post()
                .uri(uri)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .headers(h -> {
                    if (!isBlank(apiKey)) {
                        h.add(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey);
                        h.add("x-api-key", apiKey);
                    }
                    h.add("Idempotency-Key", idempotency);
                    h.add("User-Agent", "lexaro/tts (+speechify-webclient)");
                })
                .bodyValue(payload)
                .exchangeToMono(resp -> {
                    if (!resp.statusCode().is2xxSuccessful()) {
                        return resp.bodyToMono(byte[].class)
                                .defaultIfEmpty(new byte[0])
                                .flatMap(body -> Mono.error(WebClientResponseException.create(
                                        resp.statusCode().value(),
                                        resp.statusCode().toString(),
                                        resp.headers().asHttpHeaders(),
                                        body,
                                        StandardCharsets.UTF_8
                                )));
                    }
                    return resp.bodyToMono(SpeechifyJsonResponse.class);
                })
                .timeout(timeout)
                .retryWhen(retrySpec())
                .flatMap(json -> {
                    if (json == null || isBlank(json.audio_data)) {
                        return Mono.error(new RuntimeException("Speechify returned empty JSON or audio_data"));
                    }
                    try {
                        return Mono.just(Base64.getDecoder().decode(json.audio_data));
                    } catch (IllegalArgumentException bad64) {
                        return Mono.error(new RuntimeException("Speechify returned invalid base64 audio_data", bad64));
                    }
                })
                .block();
    }

    /* ---------- Legacy ---------- */
    private byte[] callLegacy(String uri,
                              String text,
                              String voice,
                              String format,
                              String engine,
                              String language) {

        Map<String, Object> legacy = new HashMap<>();
        legacy.put("text", text);
        legacy.put("voice", voice);
        legacy.put("format", format);
        if (!isBlank(engine)) legacy.put("engine", engine.trim().toLowerCase());
        if (!isBlank(language)) legacy.put("language", language.trim());

        String idempotency = UUID.nameUUIDFromBytes((voice + "|" + format + "|" + text)
                .getBytes(StandardCharsets.UTF_8)).toString();

        return client.post()
                .uri(uri)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(
                        MediaType.APPLICATION_OCTET_STREAM,
                        MediaType.asMediaType(MimeTypeUtils.parseMimeType("audio/mpeg")),
                        MediaType.APPLICATION_JSON,
                        MediaType.ALL
                )
                .headers(h -> {
                    if (!isBlank(apiKey)) {
                        h.add(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey);
                        h.add("x-api-key", apiKey);
                    }
                    h.add("Idempotency-Key", idempotency);
                    h.add("User-Agent", "lexaro/tts (+speechify-webclient)");
                })
                .bodyValue(legacy)
                .exchangeToMono(resp -> {
                    if (!resp.statusCode().is2xxSuccessful()) {
                        return resp.bodyToMono(byte[].class)
                                .defaultIfEmpty(new byte[0])
                                .flatMap(body -> Mono.error(WebClientResponseException.create(
                                        resp.statusCode().value(),
                                        resp.statusCode().toString(),
                                        resp.headers().asHttpHeaders(),
                                        body,
                                        StandardCharsets.UTF_8
                                )));
                    }

                    String ct = Optional.ofNullable(resp.headers().asHttpHeaders()
                                    .getFirst(HttpHeaders.CONTENT_TYPE))
                            .orElse("");
                    boolean looksJson = ct.toLowerCase(Locale.ROOT).contains("application/json");

                    if (!looksJson) {
                        return resp.bodyToMono(byte[].class);
                    }

                    return resp.bodyToMono(SpeechifyJsonResponse.class)
                            .map(j -> {
                                if (j == null || isBlank(j.audio_data)) {
                                    throw new RuntimeException("Speechify legacy JSON without audio_data");
                                }
                                return Base64.getDecoder().decode(j.audio_data);
                            });
                })
                .timeout(timeout)
                .retryWhen(retrySpec())
                .flatMap(bytes -> (bytes == null || bytes.length == 0)
                        ? Mono.error(new RuntimeException("Speechify returned empty audio"))
                        : Mono.just(bytes))
                .block();
    }

    /* ---------- helpers ---------- */

    private static boolean isBlank(String s) { return s == null || s.trim().isEmpty(); }

    private static String joinUrl(String base, String path) {
        if (isBlank(base)) return path;
        String b = base.trim();
        String p = path.trim();
        if (b.endsWith("/")) b = b.substring(0, b.length() - 1);
        if (!p.startsWith("/")) p = "/" + p;
        if (b.endsWith("/v1") && p.startsWith("/v1/")) p = p.substring(3);
        return b + p;
    }

    private static Retry retrySpec() {
        return Retry
                .backoff(3, Duration.ofMillis(400))
                .maxBackoff(Duration.ofSeconds(10))
                .jitter(0.5)
                .filter(SpeechifyTtsService::isTransient)
                .onRetryExhaustedThrow((sig, rs) -> rs.failure());
    }

    private static boolean isTransient(Throwable t) {
        Throwable root = root(t);
        if (root instanceof WebClientResponseException w) {
            int code = w.getStatusCode().value();
            return code == 429 || (code >= 500 && code <= 599);
        }
        String msg = safeMsg(root.getMessage()).toLowerCase(Locale.ROOT);
        return (root instanceof java.net.UnknownHostException)
                || (root instanceof java.net.SocketTimeoutException)
                || (root instanceof java.util.concurrent.TimeoutException)
                || (root instanceof java.net.ConnectException)
                || msg.contains("connection reset")
                || msg.contains("refused")
                || msg.contains("timed out")
                || msg.contains("temporarily")
                || msg.contains("try again");
    }

    private static Throwable root(Throwable t) {
        Throwable cur = t;
        while (cur.getCause() != null && cur.getCause() != cur) cur = cur.getCause();
        return cur;
    }

    private static String trimForLog(String s, int max) {
        if (s == null) return "";
        String t = s.trim().replaceAll("\\s+", " ");
        return t.length() <= max ? t : t.substring(0, max) + "…";
    }

    private static String safeMsg(String s) { return s == null ? "" : s; }

    private static RuntimeException rewrap(String message, Throwable cause) {
        return new RuntimeException(message, cause);
    }

    private static final class SpeechifyJsonResponse {
        public String audio_data;
        public String audio_format;
    }
}
