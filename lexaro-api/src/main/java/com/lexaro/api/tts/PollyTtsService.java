package com.lexaro.api.tts;

import com.lexaro.api.domain.Plan;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.polly.PollyClient;
import software.amazon.awssdk.services.polly.model.*;

import java.text.Normalizer;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

public class PollyTtsService implements TtsService {

    private static final Logger log = LoggerFactory.getLogger(PollyTtsService.class);
    private final PollyClient polly;

    /* -------- voice normalization -------- */
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
        for (VoiceId v : VoiceId.values()) {
            if (v.toString().equalsIgnoreCase(requested)) return v.toString();
        }
        return null;
    }

    /* -------- ctors -------- */
    public PollyTtsService(PollyClient polly) {
        this.polly = polly;
    }

    public PollyTtsService(String region) {
        this.polly = PollyClient.builder()
                .region(Region.of(region))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
    }

    public PollyTtsService(String region, String accessKey, String secretKey) {
        var b = PollyClient.builder().region(Region.of(region));
        if (notBlank(accessKey) && notBlank(secretKey)) {
            b.credentialsProvider(StaticCredentialsProvider.create(
                    AwsBasicCredentials.create(accessKey, secretKey)
            ));
        } else {
            b.credentialsProvider(DefaultCredentialsProvider.create());
        }
        this.polly = b.build();
    }

    /* -------- TtsService -------- */
    @Override
    public byte[] synthesize(Plan plan,
                             String text,
                             String voice,
                             String engine,
                             String format,
                             String language) throws Exception {
        // Polly derives language from the voice; `language` intentionally ignored.

        String resolvedVoice = canonicalVoice(voice);
        if (resolvedVoice == null) {
            log.debug("Unknown Polly voice '{}', falling back to Joanna", voice);
            resolvedVoice = "Joanna";
        }

        Engine e = toEngine(engine);
        OutputFormat f = toOutputFormat(format);

        SynthesizeSpeechRequest.Builder rb = SynthesizeSpeechRequest.builder()
                .text(text)
                .voiceId(VoiceId.fromValue(resolvedVoice))
                .engine(e)
                .outputFormat(f);

        SynthesizeSpeechRequest req = rb.build();

        try {
            return PollyRetry.runWithRetry(() -> polly.synthesizeSpeechAsBytes(req).asByteArray());
        } catch (PollyException ex) {
            // If NEURAL fails (voice not supported), fall back to STANDARD
            if (e == Engine.NEURAL) {
                log.warn("Polly NEURAL failed for voice '{}': {} — retrying STANDARD",
                        resolvedVoice,
                        ex.awsErrorDetails() != null ? ex.awsErrorDetails().errorMessage() : ex.toString());
                SynthesizeSpeechRequest fallbackReq = rb.engine(Engine.STANDARD).build();
                return PollyRetry.runWithRetry(() -> polly.synthesizeSpeechAsBytes(fallbackReq).asByteArray());
            }
            throw ex;
        }
    }

    /* -------- lifecycle -------- */
    @PreDestroy
    public void close() {
        try { polly.close(); } catch (Exception ignored) {}
    }

    /* -------- helpers -------- */

    private static boolean notBlank(String s) { return s != null && !s.isBlank(); }

    private static Engine toEngine(String engine) {
        String eStr = engine == null ? "" : engine.trim().toLowerCase(Locale.ROOT);
        return "neural".equals(eStr) ? Engine.NEURAL : Engine.STANDARD;
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
