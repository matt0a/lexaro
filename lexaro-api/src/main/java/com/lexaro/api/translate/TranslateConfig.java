package com.lexaro.api.translate;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TranslateConfig {

    @Bean
    @ConditionalOnProperty(name = "app.translate.enabled", havingValue = "true")
    public TranslateService translateService(
            @Value("${app.translate.provider:libre}") String provider,
            @Value("${app.translate.libre.baseUrl}") String baseUrl,
            @Value("${app.translate.apiKey:}") String apiKey,
            @Value("${app.translate.http.connectTimeout:5000}") int connectTimeoutMs,
            @Value("${app.translate.http.readTimeout:30000}") int readTimeoutMs,
            @Value("${app.translate.languagesTtlSeconds:3600}") long languagesTtlSeconds
    ) {
        // For now we only support Libre; extend here if you add other providers later.
        if (!"libre".equalsIgnoreCase(provider)) {
            throw new IllegalStateException("Unsupported translation provider: " + provider);
        }
        return new LibreTranslateService(baseUrl, apiKey, connectTimeoutMs, readTimeoutMs, languagesTtlSeconds);
    }
}
