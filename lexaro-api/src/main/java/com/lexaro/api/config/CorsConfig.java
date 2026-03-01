package com.lexaro.api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    @Value("${app.cors.allowedOrigins:https://lexaro.org,http://localhost:5173,http://localhost:3000}")
    private String[] allowedOrigins;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(Arrays.asList(allowedOrigins));  // exact origins (not "*")
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        // If-None-Match must be listed here so the browser's OPTIONS preflight for conditional
        // GETs (ETag / 304 flow) is not rejected by Spring's CORS filter.
        cfg.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Request-Id", "If-None-Match"));
        // X-Request-Id is echoed on every response by RequestCorrelationFilter; expose it so
        // browser clients can read it from cross-origin responses for end-to-end correlation.
        // ETag is exposed so browser JS can read it from /tts/voices and other cached endpoints
        // to send If-None-Match on subsequent requests for conditional 304 responses.
        cfg.setExposedHeaders(List.of("Location", "X-Request-Id", "ETag"));
        cfg.setAllowCredentials(false);                        // JWT via header, no cookies
        cfg.setMaxAge(3600L);                                  // cache preflight

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }
}
