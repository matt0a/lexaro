package com.lexaro.api.tts;

import jakarta.annotation.PreDestroy;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.polly.PollyClient;
import software.amazon.awssdk.services.polly.model.Engine;
import software.amazon.awssdk.services.polly.model.OutputFormat;
import software.amazon.awssdk.services.polly.model.SynthesizeSpeechRequest;
import software.amazon.awssdk.services.polly.model.VoiceId;

import java.util.Locale;

public class PollyTtsService implements TtsService {

    private final PollyClient polly;

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

    @Override
    public byte[] synthesize(String text, String voice, String engine, String format) {
        String resolvedVoice = notBlank(voice) ? voice : "Joanna";
        Engine resolvedEngine = "neural".equalsIgnoreCase(engine) ? Engine.NEURAL : Engine.STANDARD;
        OutputFormat resolvedFormat = toOutputFormat(format);

        var req = SynthesizeSpeechRequest.builder()
                .text(text)
                .voiceId(VoiceId.fromValue(resolvedVoice))
                .engine(resolvedEngine)
                .outputFormat(resolvedFormat)
                .build();

        return polly.synthesizeSpeechAsBytes(req).asByteArray();
    }

    @PreDestroy
    public void close() {
        try {
            polly.close();
        } catch (Exception ignored) {
        }
    }

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
