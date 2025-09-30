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

    /* ---------- voice canonicalization ---------- */

    /** Map of diacritic-insensitive, lowercase names -> exact Polly enum token. */
    private static final Map<String, String> VOICE_CANON = buildVoiceCanon();

    private static Map<String, String> buildVoiceCanon() {
        Map<String, String> m = new HashMap<>();
        for (VoiceId v : VoiceId.values()) {
            // Example: "Celine" -> key "celine"
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

    /** Returns a valid Polly voice token (e.g., "Celine") or null if not recognized. */
    private static String canonicalVoice(String requested) {
        if (requested == null || requested.isBlank()) return null;

        // First try diacritic-insensitive lookup against the enum list
        String key = stripDiacritics(requested).toLowerCase(Locale.ROOT);
        String match = VOICE_CANON.get(key);
        if (match != null) return match;

        // Then try simple case-insensitive direct match
        for (VoiceId v : VoiceId.values()) {
            if (v.toString().equalsIgnoreCase(requested)) return v.toString();
        }
        return null;
    }

    /* ---------- constructors ---------- */

    /** Use an already-configured client (handy for tests). */
    public PollyTtsService(PollyClient polly) {
        this.polly = polly;
    }

    /** Region only – credentials come from the default AWS provider chain. */
    public PollyTtsService(String region) {
        this.polly = PollyClient.builder()
                .region(Region.of(region))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
    }

    /** Region + optional static credentials. If keys are blank, fall back to default chain. */
    public PollyTtsService(String region, String accessKey, String secretKey) {
        var builder = PollyClient.builder().region(Region.of(region));
        if (notBlank(accessKey) && notBlank(secretKey)) {
            builder.credentialsProvider(
                    StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey)));
        } else {
            builder.credentialsProvider(DefaultCredentialsProvider.create());
        }
        this.polly = builder.build();
    }

    /* ---------- TtsService ---------- */

    @Override
    public byte[] synthesize(String text, String voice, String engine, String format) {
        // Resolve voice robustly (handle "Céline" -> "Celine", etc.)
        String resolved = canonicalVoice(voice);
        if (resolved == null) {
            log.debug("Unknown voice '{}', falling back to Joanna", voice);
            resolved = "Joanna";
        }

        Engine resolvedEngine = "neural".equalsIgnoreCase(engine) ? Engine.NEURAL : Engine.STANDARD;
        OutputFormat resolvedFormat = toOutputFormat(format);

        var req = SynthesizeSpeechRequest.builder()
                .text(text)
                .voiceId(VoiceId.fromValue(resolved)) // guaranteed valid enum token
                .engine(resolvedEngine)
                .outputFormat(resolvedFormat)
                .build();

        return polly.synthesizeSpeechAsBytes(req).asByteArray();
    }

    @PreDestroy
    public void close() {
        try { polly.close(); } catch (Exception ignored) {}
    }

    /* ---------- helpers ---------- */

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }

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
