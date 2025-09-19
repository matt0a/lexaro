package com.lexaro.api.tts;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TtsConfig {

    @Bean("devTtsService")
    @ConditionalOnProperty(name = "app.tts.provider", havingValue = "dev", matchIfMissing = true)
    public TtsService devTtsService() {
        return new DevTtsService();
    }

    @Bean("pollyTtsService")
    @ConditionalOnProperty(name = "app.tts.provider", havingValue = "polly")
    public TtsService pollyTtsService(
            @Value("${app.tts.polly.region}") String region,
            @Value("${app.tts.polly.accessKey:}") String accessKey,
            @Value("${app.tts.polly.secretKey:}") String secretKey
    ) {
        return new PollyTtsService(region, accessKey, secretKey);
    }
}

