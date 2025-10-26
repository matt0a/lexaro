package com.lexaro.api.tts;

import com.lexaro.api.web.dto.VoiceDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class SpeechifyCatalogService {

    private final WebClient tokenClient;   // sends: token: <apiKey>
    private final WebClient bearerClient;  // sends: Authorization: Bearer <apiKey>
    private final long timeoutMs;

    public SpeechifyCatalogService(
            @Value("${app.tts.speechify.baseUrl}") String baseUrl,
            @Value("${app.tts.speechify.apiKey}")  String apiKey,
            @Value("${app.tts.speechify.timeoutMs:90000}") long timeoutMs
    ) {
        this.timeoutMs = timeoutMs;

        // allow large payloads
        ExchangeStrategies strategies = ExchangeStrategies.builder()
                .codecs(c -> c.defaultCodecs().maxInMemorySize(10 * 1024 * 1024))
                .build();

        this.tokenClient = WebClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("token", apiKey)
                .exchangeStrategies(strategies)
                .build();

        this.bearerClient = WebClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .exchangeStrategies(strategies)
                .build();

        log.info("Speechify client initialized (token + bearer headers enabled).");
    }

    /** Blocking, header-strategy failover: token → bearer. */
    public List<VoiceDto> listVoicesBlocking() {
        try {
            return fetchWithClient(tokenClient);
        } catch (WebClientResponseException.Unauthorized ex) {
            log.warn("Speechify 401 with 'token' header; retrying with 'Authorization: Bearer'.");
            try {
                return fetchWithClient(bearerClient);
            } catch (Exception ex2) {
                log.warn("Speechify fetch failed with bearer as well: {}", ex2.toString());
                return List.of();
            }
        } catch (Exception ex) {
            log.warn("Speechify fetch failed: {}", ex.toString());
            return List.of();
        }
    }

    @SuppressWarnings("unchecked")
    private List<VoiceDto> fetchWithClient(WebClient client) {
        List<Map<String, Object>> rows = client.get()
                .uri("/v1/voices")
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .bodyToMono(List.class)
                .block(Duration.ofMillis(timeoutMs));

        if (rows == null) rows = List.of();

        List<VoiceDto> out = rows.stream().map(row -> {
            // Support both legacy flat schema and new nested schema.
            String id    = s(row.get("id"));
            String title = coalesce(
                    s(row.get("title")),
                    s(row.get("display_name")),
                    s(row.get("name")),
                    id
            );

            // --- Language & region extraction ---
            String language = null;
            String region = null;

            // 1) New schema: models[].languages[].locale -> e.g., "en-US"
            var modelsObj = row.get("models");
            if (modelsObj instanceof List<?> models && !models.isEmpty()) {
                for (Object mObj : models) {
                    if (!(mObj instanceof Map<?, ?> m)) continue;
                    Object langsObj = m.get("languages");
                    if (langsObj instanceof List<?> langs && !langs.isEmpty()) {
                        Object first = langs.get(0);
                        if (first instanceof Map<?, ?> lm) {
                            String locale = s(lm.get("locale"));      // en-US
                            if (locale != null && !locale.isBlank()) {
                                String[] parts = locale.split("[-_]");
                                String langPart = parts.length > 0 ? parts[0] : null;
                                String regPart  = parts.length > 1 ? parts[1] : null;
                                language = mapIsoToName(langPart);     // en -> English
                                region   = regPart == null ? null : regPart.toUpperCase(Locale.ROOT);
                            }
                        }
                    }
                    if (language != null) break; // got one
                }
            }

            // 2) Legacy flat fields as fallback
            if (language == null) language = s(row.get("language"));
            if (region == null)   region   = s(row.get("region"));

            String displayLang = humanLanguage(language, region);

            // --- Gender & attitude (optional) ---
            String gender  = normGender(s(row.get("gender")));
            String mood    = s(row.get("attitude"));

            // --- Preview URL (many possible keys/paths) ---
            String preview = coalesce(
                    s(row.get("previewUrl")),
                    s(row.get("preview_url")),
                    s(row.get("preview")),
                    // new schema often has models[].samples[] or models[].preview_url
                    extractFirstPreviewFromModels(modelsObj),
                    s(row.get("sampleUrl")),
                    s(row.get("sample_url"))
            );

            return new VoiceDto(
                    id, title, "speechify",
                    displayLang, region, gender, mood, preview
            );
        }).collect(Collectors.toCollection(ArrayList::new));

        // NULL-SAFE sort to prevent NPEs if language/title missing
        out.sort(Comparator
                .comparing((VoiceDto v) -> Optional.ofNullable(v.language()).orElse(""), String.CASE_INSENSITIVE_ORDER)
                .thenComparing(v -> Optional.ofNullable(v.title()).orElse(""), String.CASE_INSENSITIVE_ORDER));

        log.info("Speechify voices loaded: {}", out.size());
        return out;
    }

    /* ---------- helpers ---------- */

    private static String extractFirstPreviewFromModels(Object modelsObj) {
        if (!(modelsObj instanceof List<?> models)) return null;
        for (Object mObj : models) {
            if (!(mObj instanceof Map<?, ?> m)) continue;
            // direct keys on model
            String p = coalesce(
                    s(m.get("previewUrl")),
                    s(m.get("preview_url")),
                    s(m.get("sampleUrl")),
                    s(m.get("sample_url"))
            );
            if (p != null) return p;
            // samples array
            Object samplesObj = m.get("samples");
            if (samplesObj instanceof List<?> samples) {
                for (Object sObj : samples) {
                    if (!(sObj instanceof Map<?, ?> sm)) continue;
                    String sp = coalesce(
                            s(sm.get("url")),
                            s(sm.get("previewUrl")),
                            s(sm.get("preview_url"))
                    );
                    if (sp != null) return sp;
                }
            }
        }
        return null;
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
            default -> null;
        };
    }

    private static String s(Object o) { return o == null ? null : String.valueOf(o); }
    @SafeVarargs private static <T> T coalesce(T... vals) { for (T v : vals) if (v != null && !(v instanceof String s && s.isBlank())) return v; return null; }

    private static String normGender(String g) {
        if (g == null) return null;
        String x = g.trim().toLowerCase(Locale.ROOT);
        if (x.startsWith("f")) return "Female";
        if (x.startsWith("m")) return "Male";
        return "Other";
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
            case "german"      -> switch (R) { case "AT" -> "Austrian German"; case "CH" -> "Swiss German"; default -> "German"; };
            case "french"      -> switch (R) { case "CA" -> "Canadian French"; case "CH" -> "Swiss French"; case "BE" -> "Belgian French"; default -> "French"; };
            case "spanish"     -> switch (R) { case "ES" -> "European Spanish"; case "MX" -> "Mexican Spanish"; case "US" -> "US Spanish"; default -> "Spanish"; };
            case "portuguese"  -> switch (R) { case "BR" -> "Brazilian Portuguese"; case "PT" -> "European Portuguese"; default -> "Portuguese"; };
            case "chinese", "mandarin", "cantonese" -> "Chinese";
            case "japanese" -> "Japanese";
            case "korean"   -> "Korean";
            case "italian"  -> "Italian";
            case "dutch"    -> "Dutch";
            case "swedish"  -> "Swedish";
            case "danish"   -> "Danish";
            case "norwegian"-> "Norwegian";
            case "russian"  -> "Russian";
            default -> L;
        };
    }
}
