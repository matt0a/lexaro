package com.lexaro.api.extract;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ExtractConfig {
    @Bean
    public TextExtractor textExtractor() {
        return DefaultTextExtractor.withDefaults();
    }
}
