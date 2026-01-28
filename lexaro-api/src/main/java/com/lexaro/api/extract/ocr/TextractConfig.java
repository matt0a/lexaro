package com.lexaro.api.extract.ocr;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

/**
 * Configuration for AWS Textract OCR service.
 *
 * Creates:
 * - TextractOcrService (sync + async OCR) when app.textract.enabled=true
 * - TextractStagingService (S3 staging for async) when app.textract.staging.bucket is set
 *
 * Credentials use DefaultCredentialsProvider:
 * - AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables
 * - Or IAM instance role / ECS task role
 *
 * NOTE: The staging S3 bucket is SEPARATE from MinIO app storage.
 * It connects to real AWS S3 (no endpoint override).
 */
@Configuration
@ConditionalOnProperty(name = "app.textract.enabled", havingValue = "true", matchIfMissing = true)
public class TextractConfig {

    @Value("${app.textract.region:us-east-1}")
    private String region;

    @Value("${app.textract.accessKey:}")
    private String accessKey;

    @Value("${app.textract.secretKey:}")
    private String secretKey;

    // Staging bucket configuration (for async Textract)
    @Value("${app.textract.staging.bucket:}")
    private String stagingBucket;

    @Value("${app.textract.staging.prefix:textract-staging/}")
    private String stagingPrefix;

    @Value("${app.textract.staging.deleteAfter:true}")
    private boolean stagingDeleteAfter;

    // Async polling configuration
    @Value("${app.textract.async.pollIntervalMs:1500}")
    private long pollIntervalMs;

    @Value("${app.textract.async.timeoutSeconds:120}")
    private long timeoutSeconds;

    /**
     * S3 staging service for async Textract.
     * Only created when staging bucket is configured.
     * Connects to real AWS S3 (NOT MinIO).
     */
    @Bean
    @ConditionalOnProperty(name = "app.textract.staging.bucket")
    public TextractStagingService textractStagingService() {
        return new TextractStagingService(region, stagingBucket, stagingPrefix, stagingDeleteAfter, accessKey, secretKey);
    }

    /**
     * Main Textract OCR service.
     * Supports both sync (images) and async (multi-page PDFs) modes.
     * Async mode requires staging service to be available.
     *
     * Marked @Primary so it's used when OcrService is injected.
     */
    @Bean
    @Primary
    public TextractOcrService textractOcrService(
            @Autowired(required = false) TextractStagingService stagingService) {
        return new TextractOcrService(region, stagingService, pollIntervalMs, timeoutSeconds, accessKey, secretKey);
    }
}
