package com.lexaro.api.tts;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lexaro.api.web.dto.VoiceDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class SpeechifyCatalogService {

    private final WebClient speechifyWebClient;
    private final ObjectMapper om = new ObjectMapper();

    private final String apiKey;
    private final long timeoutMs;

    public SpeechifyCatalogService(
            @Qualifier("speechifyWebClient") WebClient speechifyWebClient,
            @Value("${app.tts.speechify.apiKey}") String apiKey,
            @Value("${app.tts.speechify.timeoutMs:90000}") long timeoutMs
    ) {
        this.speechifyWebClient = speechifyWebClient;
        this.apiKey = apiKey;
        this.timeoutMs = timeoutMs;
    }

    /** Blocking, header-strategy failover: token → bearer. */
    public List<VoiceDto> listVoicesBlocking() {
        try {
            return fetchWithHeader("token", apiKey);
        } catch (WebClientResponseException.Unauthorized ex) {
            log.warn("Speechify 401 with 'token' header; retrying with 'Authorization: Bearer'.");
            try {
                return fetchWithHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey);
            } catch (Exception ex2) {
                log.warn("Speechify fetch failed with bearer as well: {}", ex2.toString());
                return List.of();
            }
        } catch (Exception ex) {
            log.warn("Speechify fetch failed: {}", ex.toString());
            return List.of();
        }
    }

    private List<VoiceDto> fetchWithHeader(String headerName, String headerValue) {
        String body = speechifyWebClient.get()
                .uri("/v1/voices")
                .accept(MediaType.APPLICATION_JSON)
                .headers(h -> h.set(headerName, headerValue))
                .retrieve()
                .bodyToMono(String.class)
                .block(Duration.ofMillis(timeoutMs));

        if (body == null || body.isBlank()) return List.of();

        try {
            JsonNode root = om.readTree(body);

            JsonNode voicesNode = null;
            if (root.isArray()) {
                voicesNode = root;
            } else if (root.isObject()) {
                // most common
                if (root.hasNonNull("voices") && root.get("voices").isArray()) voicesNode = root.get("voices");
                    // sometimes providers use "data"
                else if (root.hasNonNull("data") && root.get("data").isArray()) voicesNode = root.get("data");
            }

            if (voicesNode == null || !voicesNode.isArray()) return List.of();

            List<VoiceDto> out = new ArrayList<>();

            for (JsonNode v : voicesNode) {
                String id = text(v, "id");
                if (id == null || id.isBlank()) continue;

                String title = coalesce(
                        text(v, "title"),
                        text(v, "display_name"),
                        text(v, "name"),
                        id
                );

                // language/region from models.languages[0].locale (best)
                String language = null;
                String region = null;

                JsonNode models = v.get("models");
                if (models != null && models.isArray()) {
                    for (JsonNode m : models) {
                        JsonNode langs = m.get("languages");
                        if (langs != null && langs.isArray() && langs.size() > 0) {
                            JsonNode first = langs.get(0);
                            String locale = text(first, "locale"); // en-US
                            if (locale != null && !locale.isBlank()) {
                                String[] parts = locale.split("[-_]");
                                String iso = parts.length > 0 ? parts[0] : null;
                                String reg = parts.length > 1 ? parts[1] : null;
                                language = mapIsoToName(iso);
                                region = reg == null ? null : reg.toUpperCase(Locale.ROOT);
                                break;
                            }
                        }
                    }
                }

                // fallback direct fields
                if (language == null) language = normalizeProviderLanguage(text(v, "language"));
                if (region == null) region = upper2(text(v, "region"));

                String displayLang = humanLanguage(language, region);

                String gender = normGender(text(v, "gender"));
                String mood = text(v, "attitude");

                // ✅ Preview audio + avatar image
                String preview = coalesce(
                        text(v, "preview_audio"),
                        text(v, "previewAudio"),
                        text(v, "preview_url"),
                        text(v, "previewUrl"),
                        extractFirstPreviewFromModels(models)
                );

                String avatar = coalesce(
                        text(v, "avatar_image"),
                        text(v, "avatarImage"),
                        text(v, "avatar"),
                        text(v, "image")
                );

                out.add(new VoiceDto(
                        id,
                        title,
                        "speechify",
                        displayLang,
                        region,
                        gender,
                        mood,
                        preview,
                        avatar
                ));
            }

            out.sort(Comparator
                    .comparing((VoiceDto vv) -> Optional.ofNullable(vv.language()).orElse(""), String.CASE_INSENSITIVE_ORDER)
                    .thenComparing(vv -> Optional.ofNullable(vv.title()).orElse(""), String.CASE_INSENSITIVE_ORDER));

            log.info("Speechify voices loaded: {}", out.size());
            return out;

        } catch (Exception e) {
            log.warn("Speechify JSON parse failed: {}", e.toString());
            return List.of();
        }
    }

    /* ---------- helpers ---------- */

    private static String extractFirstPreviewFromModels(JsonNode models) {
        if (models == null || !models.isArray()) return null;

        for (JsonNode m : models) {
            String p = coalesce(
                    text(m, "preview_audio"),
                    text(m, "previewAudio"),
                    text(m, "previewUrl"),
                    text(m, "preview_url"),
                    text(m, "sampleUrl"),
                    text(m, "sample_url")
            );
            if (p != null) return p;

            JsonNode samples = m.get("samples");
            if (samples != null && samples.isArray()) {
                for (JsonNode sm : samples) {
                    String sp = coalesce(
                            text(sm, "url"),
                            text(sm, "previewUrl"),
                            text(sm, "preview_url"),
                            text(sm, "preview_audio")
                    );
                    if (sp != null) return sp;
                }
            }
        }
        return null;
    }

    private static String text(JsonNode n, String field) {
        if (n == null) return null;
        JsonNode v = n.get(field);
        if (v == null || v.isNull()) return null;
        String s = v.asText();
        return (s == null || s.isBlank()) ? null : s;
    }

    @SafeVarargs
    private static <T> T coalesce(T... vals) {
        for (T v : vals) {
            if (v == null) continue;
            if (v instanceof String s) {
                if (!s.isBlank()) return v;
            } else return v;
        }
        return null;
    }

    private static String upper2(String r) {
        if (r == null || r.isBlank()) return null;
        return r.trim().toUpperCase(Locale.ROOT);
    }

    private static String normGender(String g) {
        if (g == null) return null;
        String x = g.trim().toLowerCase(Locale.ROOT);
        if (x.startsWith("f")) return "Female";
        if (x.startsWith("m")) return "Male";
        return "Other";
    }

    private static String normalizeProviderLanguage(String raw) {
        if (raw == null || raw.isBlank()) return null;
        String s = raw.trim();
        // If Speechify returns locale-ish values, normalize a bit
        String lower = s.toLowerCase(Locale.ROOT);
        if (lower.startsWith("en")) return "English";
        if (lower.startsWith("es")) return "Spanish";
        if (lower.startsWith("fr")) return "French";
        if (lower.startsWith("pt")) return "Portuguese";
        if (lower.startsWith("de")) return "German";
        if (lower.startsWith("ar")) return "Arabic";
        if (lower.startsWith("hi")) return "Hindi";
        return s;
    }

    private static String mapIsoToName(String iso) {
        if (iso == null) return null;
        return switch (iso.toLowerCase(Locale.ROOT)) {
            case "en" -> "English";
            case "de" -> "German";
            case "fr" -> "French";
            case "es" -> "Spanish";
            case "pt" -> "Portuguese";
            case "zh", "cmn", "yue" -> "Chinese";
            case "ja" -> "Japanese";
            case "ko" -> "Korean";
            case "it" -> "Italian";
            case "nl" -> "Dutch";
            case "sv" -> "Swedish";
            case "da" -> "Danish";
            case "no", "nb", "nn" -> "Norwegian";
            case "ru" -> "Russian";
            case "ar" -> "Arabic";
            case "hi" -> "Hindi";
            default -> null;
        };
    }

    /** Don’t force English when missing—let UI show Unknown/Other. */
    private static String humanLanguage(String language, String region) {
        if (language == null || language.isBlank()) return null;
        String L = language.trim();
        String R = region == null ? "" : region.trim().toUpperCase(Locale.ROOT);

        return switch (L.toLowerCase(Locale.ROOT)) {
            case "english" -> switch (R) {
                case "US" -> "US English";
                case "GB", "UK" -> "UK English";
                case "AU" -> "Australian English";
                case "CA" -> "Canadian English";
                case "IN" -> "Indian English";
                case "IE" -> "Irish English";
                case "NZ" -> "New Zealand English";
                case "ZA" -> "South African English";
                case "AE" -> "UAE English";
                default -> "English";
            };
            case "german" -> switch (R) {
                case "AT" -> "Austrian German";
                case "CH" -> "Swiss German";
                default -> "German";
            };
            case "french" -> switch (R) {
                case "CA" -> "Canadian French";
                case "CH" -> "Swiss French";
                case "BE" -> "Belgian French";
                default -> "French";
            };
            case "spanish" -> switch (R) {
                case "ES" -> "European Spanish";
                case "MX" -> "Mexican Spanish";
                case "US" -> "US Spanish";
                default -> "Spanish";
            };
            case "portuguese" -> switch (R) {
                case "BR" -> "Brazilian Portuguese";
                case "PT" -> "European Portuguese";
                default -> "Portuguese";
            };
            case "arabic" -> "Arabic";
            case "hindi" -> "Hindi";
            case "chinese", "mandarin", "cantonese" -> "Chinese";
            case "japanese" -> "Japanese";
            case "korean" -> "Korean";
            case "italian" -> "Italian";
            case "dutch" -> "Dutch";
            case "swedish" -> "Swedish";
            case "danish" -> "Danish";
            case "norwegian" -> "Norwegian";
            case "russian" -> "Russian";
            default -> L;
        };
    }
}
