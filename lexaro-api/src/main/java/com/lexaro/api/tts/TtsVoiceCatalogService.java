package com.lexaro.api.tts;

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
import software.amazon.awssdk.services.polly.model.DescribeVoicesRequest;
import software.amazon.awssdk.services.polly.model.Engine;
import software.amazon.awssdk.services.polly.model.Gender;
import software.amazon.awssdk.services.polly.model.PollyException;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

/** Fetches/caches the Polly voice catalog and tells you which engines each voice supports. */
@Slf4j
@Service
@RequiredArgsConstructor
public class TtsVoiceCatalogService {

    public record VoiceInfo(String name, String gender, String language, Set<String> enginesSupported) {}

    @Value("${app.tts.polly.region:us-east-1}") private String region;
    @Value("${app.tts.polly.accessKey:}")       private String accessKey;
    @Value("${app.tts.polly.secretKey:}")       private String secretKey;

    @Value("${app.tts.voices.cacheTtlMinutes:1440}") // 24h default
    private long cacheTtlMinutes;

    private final AtomicReference<Cache> cacheRef = new AtomicReference<>(null);

    @Getter
    private static class Cache {
        final Instant fetchedAt;
        final Map<String, VoiceInfo> byName; // key: uppercase name

        Cache(Instant fetchedAt, Map<String, VoiceInfo> byName) {
            this.fetchedAt = fetchedAt;
            this.byName = byName;
        }
    }

    public List<VoiceInfo> listVoices() {
        ensureFresh();
        return new ArrayList<>(cacheRef.get().byName.values())
                .stream()
                .sorted(Comparator.comparing(VoiceInfo::name))
                .collect(Collectors.toList());
    }

    public Optional<VoiceInfo> findByName(String name) {
        if (name == null || name.isBlank()) return Optional.empty();
        ensureFresh();
        return Optional.ofNullable(cacheRef.get().byName.get(name.trim().toUpperCase(Locale.ROOT)));
    }

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

            // We query twice to learn engine support.
            var standardVoices = client.describeVoices(DescribeVoicesRequest.builder()
                    .engine(Engine.STANDARD)
                    .build()).voices();

            var neuralVoices = client.describeVoices(DescribeVoicesRequest.builder()
                    .engine(Engine.NEURAL)
                    .build()).voices();

            Map<String, Set<String>> engineMap = new HashMap<>();

            for (var v : standardVoices) {
                engineMap.computeIfAbsent(v.name(), k -> new HashSet<>()).add("standard");
            }
            for (var v : neuralVoices) {
                engineMap.computeIfAbsent(v.name(), k -> new HashSet<>()).add("neural");
            }

            // Build final map (prefer attributes from standard list; fallback to neural list)
            Map<String, VoiceInfo> byName = new HashMap<>();
            Map<String, software.amazon.awssdk.services.polly.model.Voice> attr = new HashMap<>();
            standardVoices.forEach(v -> attr.put(v.name(), v));
            neuralVoices.forEach(v -> attr.putIfAbsent(v.name(), v));

            for (var e : engineMap.entrySet()) {
                String name = e.getKey();
                var v = attr.get(name);
                String gender = v.gender() == Gender.MALE ? "MALE" : (v.gender() == Gender.FEMALE ? "FEMALE" : "UNKNOWN");
                String lang = v.languageName() != null ? v.languageName() : v.languageCodeAsString();
                var info = new VoiceInfo(name, gender, lang, Collections.unmodifiableSet(e.getValue()));
                byName.put(name.toUpperCase(Locale.ROOT), info);
            }

            log.info("Polly voices loaded: {} total", byName.size());
            return byName;

        } catch (PollyException ex) {
            log.error("Failed to load voices from Polly: {}", ex.toString(), ex);
            // If Polly fails, keep prior cache (if any); otherwise fallback to minimal.
            Cache prev = cacheRef.get();
            if (prev != null) return prev.byName;
            return Map.of();
        }
    }

    /** True if the voice exists (case-insensitive). */
    public boolean isValidVoice(String name) {
        return findByName(name).isPresent();
    }

    /** True if the given voice supports the given engine ("standard" or "neural"). */
    public boolean voiceSupportsEngine(String voiceName, String engine) {
        if (engine == null || engine.isBlank()) return false;
        return findByName(voiceName)
                .map(v -> v.enginesSupported().contains(engine.toLowerCase(Locale.ROOT)))
                .orElse(false);
    }

    /** Convenience list of just the voice names (unsorted). */
    public List<String> voiceNames() {
        return listVoices().stream().map(VoiceInfo::name).toList();
    }
}
