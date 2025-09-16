package com.lexaro.api.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class StorageConfig {

    @Bean(name = "storageService")
    public StorageService storageService(
            @Value("${app.storage.provider:noop}") String provider,
            @Value("${app.storage.bucket:}") String bucket,
            @Value("${app.storage.endpoint:}") String endpoint,
            @Value("${app.storage.accessKey:}") String accessKey,
            @Value("${app.storage.secretKey:}") String secretKey,
            @Value("${app.storage.region:us-east-1}") String region
    ) {
        if ("s3".equalsIgnoreCase(provider)) {
            // builds the concrete S3 impl here (no separate bean registered)
            return new S3StorageService(bucket, endpoint, accessKey, secretKey, region);
        }
        // default fallback
        return new NoopStorageService();
    }
}
