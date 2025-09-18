package com.lexaro.api.tts;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TtsConfig {

    /**
     * DEV stub (default when app.tts.provider is missing or set to "dev").
     */
    @Bean(name = "ttsService")
    @ConditionalOnProperty(name = "app.tts.provider", havingValue = "dev", matchIfMissing = true)
    public TtsService devTtsService() {
        return new DevTtsService();
    }

    /**
     * AWS Polly implementation.
     * Region is required (defaults to us-east-1). Access/secret are optional; if omitted,
     * the AWS Default Credentials Provider chain is used (env vars, profile, etc.).
     */
    @Bean(name = "ttsService")
    @ConditionalOnProperty(name = "app.tts.provider", havingValue = "polly")
    public TtsService pollyTtsService(
            @Value("${app.tts.polly.region:us-east-1}") String region,
            @Value("${app.tts.polly.accessKey:}") String accessKey,
            @Value("${app.tts.polly.secretKey:}") String secretKey
    ) {
        return new PollyTtsService(region, accessKey, secretKey);
    }
}
