package com.lexaro.api.translate;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Translation wiring. By default translation is DISABLED.
 *
 * Set app.translate.enabled=true to enable the real provider.
 */
@Configuration
public class TranslateConfig {

    /**
     * When translation is ENABLED, register the real provider (Libre).
     */
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
        if (!"libre".equalsIgnoreCase(provider)) {
            throw new IllegalStateException("Unsupported translation provider: " + provider);
        }
        return new LibreTranslateService(baseUrl, apiKey, connectTimeoutMs, readTimeoutMs, languagesTtlSeconds);
    }

    /**
     * When translation is DISABLED (default), or if a real TranslateService bean
     * is missing for any reason, use the No-Op implementation which returns
     * the input text unchanged and an empty languages list.
     */
    @Bean
    @ConditionalOnProperty(name = "app.translate.enabled", havingValue = "false", matchIfMissing = true)
    public TranslateService noOpTranslateService() {
        return new NoOpTranslateService();
    }

    /**
     * Safety net: if app.translate.enabled=true but no provider bean exists,
     * still provide No-Op to avoid startup failure.
     */
    @Bean
    @ConditionalOnMissingBean(TranslateService.class)
    public TranslateService fallbackNoOpTranslateService() {
        return new NoOpTranslateService();
    }
}
