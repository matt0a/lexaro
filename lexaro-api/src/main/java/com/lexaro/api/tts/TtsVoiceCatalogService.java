package com.lexaro.api.tts;

import com.lexaro.api.web.dto.VoiceDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.polly.PollyClient;
import software.amazon.awssdk.services.polly.model.*;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TtsVoiceCatalogService {

    public record VoiceInfo(String name, String gender, String language, Set<String> enginesSupported) {}

    @Value("${app.tts.polly.region:us-east-1}") private String region;
    @Value("${app.tts.polly.accessKey:}")       private String accessKey;
    @Value("${app.tts.polly.secretKey:}")       private String secretKey;
    // cacheTtlMinutes is retained for backward config compatibility but TTL is now
    // managed by Spring Cache (app.cache.voices-catalog.ttl-seconds in CacheConfig).
    @Value("${app.tts.voices.cacheTtlMinutes:1440}") private long cacheTtlMinutesLegacy;

    private final SpeechifyCatalogService speechifyCatalogService;

    /**
     * Returns the unified voice catalog for the given plan tier.
     *
     * <p>FREE plan users receive exactly two Polly voices (Joanna + Matthew).
     * PREMIUM, BUSINESS, and BUSINESS_PLUS users receive the full Speechify catalog.
     *
     * <p>Cached under {@code voices-catalog} keyed by the normalised plan string
     * (e.g. {@code "FREE"}, {@code "PREMIUM"}). TTL is configured via
     * {@code app.cache.voices-catalog.ttl-seconds} (default 24 hours).
     * The key {@code "FREE"} covers the null/blank case as well.
     *
     * @param plan raw plan string from the HTTP query param; null/blank treated as FREE
     * @return sorted list of VoiceDto instances appropriate for the plan
     */
    @Cacheable(
            cacheNames = "voices-catalog",
            key = "(#plan == null || #plan.trim().isEmpty()) ? 'FREE' : #plan.trim().toUpperCase()"
    )
    public List<VoiceDto> listUnifiedCatalog(String plan) {
        final String p = plan == null ? "FREE" : plan.trim().toUpperCase(Locale.ROOT);
        final boolean isPaid = switch (p) {
            case "PREMIUM", "PREMIUM_PLUS", "BUSINESS", "BUSINESS_PLUS" -> true;
            default -> false;
        };

        List<VoiceDto> out = new ArrayList<>();

        if (isPaid) {
            try {
                out.addAll(speechifyCatalogService.listVoicesBlocking());
            } catch (Exception ignore) { /* empty */ }
        } else {
            List<VoiceInfo> polly = listVoices();

            Optional<VoiceInfo> joanna = polly.stream()
                    .filter(v -> "JOANNA".equalsIgnoreCase(v.name()))
                    .findFirst();

            Optional<VoiceInfo> matthew = polly.stream()
                    .filter(v -> "MATTHEW".equalsIgnoreCase(v.name()))
                    .findFirst();

            if (matthew.isEmpty()) {
                matthew = polly.stream()
                        .filter(v -> "MALE".equalsIgnoreCase(v.gender()))
                        .filter(v -> v.language() != null && v.language().toLowerCase(Locale.ROOT).contains("english"))
                        .findFirst();
            }

            joanna.ifPresent(v -> out.add(new VoiceDto(
                    v.name(),
                    "Female (Joanna)",
                    "polly",
                    humanLanguage(v.language(), "US"),
                    "US",
                    "Female",
                    null,
                    null,
                    null
            )));

            matthew.ifPresent(v -> out.add(new VoiceDto(
                    v.name(),
                    "Male (Matthew)",
                    "polly",
                    humanLanguage(v.language(), "US"),
                    "US",
                    "Male",
                    null,
                    null,
                    null
            )));
        }

        out.sort(Comparator
                .comparing((VoiceDto v) -> Optional.ofNullable(v.language()).orElse(""), String.CASE_INSENSITIVE_ORDER)
                .thenComparing(v -> Optional.ofNullable(v.title()).orElse(""), String.CASE_INSENSITIVE_ORDER));

        return out;
    }

    /* ---------------- Polly catalog (Spring Cache manages TTL) ---------------- */

    /**
     * Returns a sorted list of all Polly voice descriptors.
     *
     * <p>Cached under {@code voices-catalog} with the fixed key {@code 'polly-raw'}.
     * The cache TTL is controlled by {@code app.cache.voices-catalog.ttl-seconds}
     * (default 24 hours via {@link com.lexaro.api.config.CacheConfig}).
     * The previous {@link java.util.concurrent.atomic.AtomicReference}-based manual cache
     * has been removed in favour of this Spring-managed cache so there is a single
     * source of truth for all caching TTL configuration.
     *
     * @return all Polly VoiceInfo entries sorted by name
     */
    @Cacheable(cacheNames = "voices-catalog", key = "'polly-raw'")
    public List<VoiceInfo> listVoices() {
        Map<String, VoiceInfo> byNameUpper = fetchFromPolly();
        return new ArrayList<>(byNameUpper.values())
                .stream()
                .sorted(Comparator.comparing(VoiceInfo::name))
                .collect(Collectors.toList());
    }

    /**
     * Looks up a Polly voice by name (case-insensitive).
     *
     * <p>Delegates to {@link #listVoices()} which is Spring-cached, so this lookup
     * is effectively O(n) over the cached list rather than hitting Polly on each call.
     *
     * @param name the voice name to look up (e.g. "Joanna")
     * @return an Optional containing the VoiceInfo, or empty if not found
     */
    public Optional<VoiceInfo> findByName(String name) {
        if (name == null || name.isBlank()) return Optional.empty();
        String upper = name.trim().toUpperCase(Locale.ROOT);
        return listVoices().stream()
                .filter(v -> v.name().toUpperCase(Locale.ROOT).equals(upper))
                .findFirst();
    }

    public boolean isKnownPollyVoice(String name) { return findByName(name).isPresent(); }

    private Map<String, VoiceInfo> fetchFromPolly() {
        AwsCredentialsProvider creds = (accessKey != null && !accessKey.isBlank() &&
                secretKey != null && !secretKey.isBlank())
                ? StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey))
                : DefaultCredentialsProvider.create();

        try (PollyClient client = PollyClient.builder()
                .region(Region.of(region))
                .credentialsProvider(creds)
                .build()) {

            var standardVoices = client.describeVoices(DescribeVoicesRequest.builder()
                    .engine(Engine.STANDARD).build()).voices();
            var neuralVoices = client.describeVoices(DescribeVoicesRequest.builder()
                    .engine(Engine.NEURAL).build()).voices();

            Map<String, Set<String>> engineMap = new HashMap<>();
            for (var v : standardVoices) engineMap.computeIfAbsent(v.name(), k -> new HashSet<>()).add("standard");
            for (var v : neuralVoices)  engineMap.computeIfAbsent(v.name(), k -> new HashSet<>()).add("neural");

            Map<String, VoiceInfo> byNameUpper = new HashMap<>();
            Map<String, Voice> attr = new HashMap<>();
            standardVoices.forEach(v -> attr.put(v.name(), v));
            neuralVoices.forEach(v -> attr.putIfAbsent(v.name(), v));

            for (var e : engineMap.entrySet()) {
                String name = e.getKey();
                var v = attr.get(name);
                String gender = v.gender() == Gender.MALE ? "MALE"
                        : (v.gender() == Gender.FEMALE ? "FEMALE" : "UNKNOWN");
                String lang = v.languageName() != null ? v.languageName() : v.languageCodeAsString();
                var info = new VoiceInfo(name, gender, lang, Collections.unmodifiableSet(e.getValue()));
                byNameUpper.put(name.toUpperCase(Locale.ROOT), info);
            }
            log.info("Polly voices loaded: {} total", byNameUpper.size());
            return byNameUpper;

        } catch (PollyException ex) {
            // On Polly failure, return an empty map. Spring Cache will NOT store this result
            // because CaffeineCache is configured with allowNullValues=false and an empty map
            // is a valid (non-null) value — it will be cached. If Polly is intermittently
            // unavailable, the next cache miss will retry. Log at ERROR so operators are alerted.
            log.error("Failed to load voices from Polly: {}", ex.toString(), ex);
            return Map.of();
        }
    }

    public boolean isValidVoice(String name) { return isKnownPollyVoice(name); }

    public boolean voiceSupportsEngine(String voiceName, String engine) {
        if (engine == null || engine.isBlank()) return false;
        return findByName(voiceName)
                .map(v -> v.enginesSupported().contains(engine.toLowerCase(Locale.ROOT)))
                .orElse(false);
    }

    public List<String> voiceNames() {
        return listVoices().stream().map(VoiceInfo::name).toList();
    }

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
            case "german" -> switch (R) { case "AT" -> "Austrian German"; case "CH" -> "Swiss German"; default -> "German"; };
            case "french" -> switch (R) { case "CA" -> "Canadian French"; case "CH" -> "Swiss French"; case "BE" -> "Belgian French"; default -> "French"; };
            case "spanish" -> switch (R) { case "ES" -> "European Spanish"; case "MX" -> "Mexican Spanish"; case "US" -> "US Spanish"; default -> "Spanish"; };
            case "portuguese" -> switch (R) { case "BR" -> "Brazilian Portuguese"; case "PT" -> "European Portuguese"; default -> "Portuguese"; };
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
