package com.lexaro.api.tts;

import com.lexaro.api.web.dto.VoiceDto;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.polly.PollyClient;
import software.amazon.awssdk.services.polly.model.*;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TtsVoiceCatalogService {

    public record VoiceInfo(String name, String gender, String language, Set<String> enginesSupported) {}

    @Value("${app.tts.polly.region:us-east-1}") private String region;
    @Value("${app.tts.polly.accessKey:}")       private String accessKey;
    @Value("${app.tts.polly.secretKey:}")       private String secretKey;
    @Value("${app.tts.voices.cacheTtlMinutes:1440}") private long cacheTtlMinutes;

    private final AtomicReference<Cache> cacheRef = new AtomicReference<>(null);
    private final SpeechifyCatalogService speechifyCatalogService;

    @Getter
    private static class Cache {
        final Instant fetchedAt;
        final Map<String, VoiceInfo> byNameUpper;
        Cache(Instant fetchedAt, Map<String, VoiceInfo> byNameUpper) {
            this.fetchedAt = fetchedAt;
            this.byNameUpper = byNameUpper;
        }
    }

    /** FREE: exactly [Joanna (F), Matthew (M)] from Polly. PAID: Speechify catalog. */
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

    /* ---------------- Polly cache logic ---------------- */

    public List<VoiceInfo> listVoices() {
        ensureFresh();
        return new ArrayList<>(cacheRef.get().byNameUpper.values())
                .stream()
                .sorted(Comparator.comparing(VoiceInfo::name))
                .collect(Collectors.toList());
    }

    public Optional<VoiceInfo> findByName(String name) {
        if (name == null || name.isBlank()) return Optional.empty();
        ensureFresh();
        return Optional.ofNullable(cacheRef.get().byNameUpper.get(name.trim().toUpperCase(Locale.ROOT)));
    }

    public boolean isKnownPollyVoice(String name) { return findByName(name).isPresent(); }

    private void ensureFresh() {
        Cache c = cacheRef.get();
        if (c != null && c.fetchedAt.plusSeconds(cacheTtlMinutes * 60).isAfter(Instant.now())) return;

        synchronized (this) {
            c = cacheRef.get();
            if (c != null && c.fetchedAt.plusSeconds(cacheTtlMinutes * 60).isAfter(Instant.now())) return;
            cacheRef.set(new Cache(Instant.now(), fetchFromPolly()));
        }
    }

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
            log.error("Failed to load voices from Polly: {}", ex.toString(), ex);
            Cache prev = cacheRef.get();
            if (prev != null) return prev.byNameUpper;
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
