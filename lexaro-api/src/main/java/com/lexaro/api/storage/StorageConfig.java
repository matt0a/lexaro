package com.lexaro.api.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class StorageConfig {
    @Value("${app.storage.provider:noop}")
    private String provider;

    private final S3StorageService s3;
    private final NoopStorageService noop;

    public StorageConfig(S3StorageService s3, NoopStorageService noop) {
        this.s3 = s3; this.noop = noop;
    }

    @Bean
    public StorageService storageService() {
        return "s3".equalsIgnoreCase(provider) ? s3 : noop;
    }
}
