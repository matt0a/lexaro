package com.lexaro.api.tts;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;

@Configuration
public class TtsConfig {

    /* ---------- POLLY ---------- */
    @Bean("pollyTtsService")
    public TtsService pollyTtsService(
            @Value("${app.tts.polly.region}") String region,
            @Value("${app.tts.polly.accessKey:}") String accessKey,
            @Value("${app.tts.polly.secretKey:}") String secretKey
    ) {
        return new PollyTtsService(region, accessKey, secretKey);
    }

    /* ---------- SPEECHIFY ---------- */
    @Bean("speechifyTtsService")
    public TtsService speechifyTtsService(
            @Value("${app.tts.speechify.baseUrl:https://api.sws.speechify.com}") String baseUrl,
            @Value("${app.tts.speechify.apiKey:}") String apiKey,
            @Qualifier("speechifyWebClient") WebClient speechifyWebClient,  // <-- reuse bean from SpeechifyHttpConfig
            @Value("${app.tts.speechify.timeoutMs:20000}") long timeoutMs,
            @Value("${app.tts.speechify.defaultVoice:alloy}") String defaultVoice
    ) {
        return new SpeechifyTtsService(
                baseUrl,
                apiKey,
                speechifyWebClient,
                Duration.ofMillis(timeoutMs),
                defaultVoice
        );
    }

    /* ---------- ROUTER (Primary) ---------- */
    @Primary
    @Bean("routingTtsService")
    public TtsService routingTtsService(
            @Qualifier("pollyTtsService") TtsService polly,
            @Qualifier("speechifyTtsService") TtsService speechify
    ) {
        return new DelegatingTtsService(polly, speechify);
    }
}
