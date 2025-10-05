package com.lexaro.api.tts;

import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.polly.PollyClient;
import software.amazon.awssdk.services.polly.model.Engine;
import software.amazon.awssdk.services.polly.model.OutputFormat;
import software.amazon.awssdk.services.polly.model.SynthesizeSpeechRequest;
import software.amazon.awssdk.services.polly.model.VoiceId;

import java.text.Normalizer;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

public class PollyTtsService implements TtsService {

    private static final Logger log = LoggerFactory.getLogger(PollyTtsService.class);
    private final PollyClient polly;

    private static final Map<String, String> VOICE_CANON = buildVoiceCanon();
    private static Map<String, String> buildVoiceCanon() {
        Map<String, String> m = new HashMap<>();
        for (VoiceId v : VoiceId.values()) {
            String exact = v.toString();
            String key = stripDiacritics(exact).toLowerCase(Locale.ROOT);
            m.put(key, exact);
        }
        return m;
    }
    private static String stripDiacritics(String s) {
        if (s == null) return null;
        String n = Normalizer.normalize(s, Normalizer.Form.NFD);
        return n.replaceAll("\\p{M}+", "");
    }
    private static String canonicalVoice(String requested) {
        if (requested == null || requested.isBlank()) return null;
        String key = stripDiacritics(requested).toLowerCase(Locale.ROOT);
        String match = VOICE_CANON.get(key);
        if (match != null) return match;
        for (VoiceId v : VoiceId.values()) if (v.toString().equalsIgnoreCase(requested)) return v.toString();
        return null;
    }

    public PollyTtsService(PollyClient polly) { this.polly = polly; }
    public PollyTtsService(String region) {
        this.polly = PollyClient.builder()
                .region(Region.of(region))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
    }
    public PollyTtsService(String region, String accessKey, String secretKey) {
        var b = PollyClient.builder().region(Region.of(region));
        if (notBlank(accessKey) && notBlank(secretKey)) {
            b.credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey)));
        } else {
            b.credentialsProvider(DefaultCredentialsProvider.create());
        }
        this.polly = b.build();
    }

    @Override
    public byte[] synthesize(String text, String voice, String engine, String format) {
        String resolved = canonicalVoice(voice);
        if (resolved == null) {
            log.debug("Unknown voice '{}', falling back to Joanna", voice);
            resolved = "Joanna";
        }
        Engine e = "neural".equalsIgnoreCase(engine) ? Engine.NEURAL : Engine.STANDARD;
        OutputFormat f = toOutputFormat(format);

        var req = SynthesizeSpeechRequest.builder()
                .text(text)
                .voiceId(VoiceId.fromValue(resolved))
                .engine(e)
                .outputFormat(f)
                .build();

        try {
            return PollyRetry.runWithRetry(() -> polly.synthesizeSpeechAsBytes(req).asByteArray());
        } catch (Exception ex) {
            throw new RuntimeException("Polly synth failed", ex);
        }
    }

    @PreDestroy public void close() { try { polly.close(); } catch (Exception ignored) {} }

    private static boolean notBlank(String s) { return s != null && !s.isBlank(); }
    private static OutputFormat toOutputFormat(String format) {
        if (!notBlank(format)) return OutputFormat.MP3;
        return switch (format.toLowerCase(Locale.ROOT)) {
            case "mp3" -> OutputFormat.MP3;
            case "ogg_vorbis", "ogg" -> OutputFormat.OGG_VORBIS;
            case "pcm" -> OutputFormat.PCM;
            default -> OutputFormat.MP3;
        };
    }
}
