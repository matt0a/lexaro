package com.lexaro.api.extract.ocr;

import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

/**
 * AWS S3 client for Textract staging bucket.
 *
 * This is SEPARATE from the app's MinIO storage (S3StorageService).
 * - Uses DefaultCredentialsProvider (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY env vars)
 * - Connects to real AWS S3 (no endpoint override)
 * - Standard virtual-hosted style (no path-style)
 *
 * Used to temporarily stage documents for async Textract processing.
 */
@Slf4j
public class TextractStagingService {

    private final S3Client s3;
    private final String bucket;
    private final String prefix;
    private final boolean deleteAfter;

    /**
     * Create staging service for real AWS S3.
     *
     * @param region      AWS region (e.g., "us-east-1")
     * @param bucket      S3 bucket name for staging
     * @param prefix      Key prefix for staged objects (e.g., "textract-staging/")
     * @param deleteAfter Whether to delete staged objects after successful processing
     * @param accessKey   AWS access key (optional, uses DefaultCredentialsProvider if blank)
     * @param secretKey   AWS secret key (optional, uses DefaultCredentialsProvider if blank)
     */
    public TextractStagingService(String region, String bucket, String prefix, boolean deleteAfter,
                                   String accessKey, String secretKey) {
        this.bucket = bucket;
        this.prefix = prefix != null ? prefix : "";
        this.deleteAfter = deleteAfter;

        // Use static credentials if provided, otherwise fall back to DefaultCredentialsProvider
        AwsCredentialsProvider creds;
        if (notBlank(accessKey) && notBlank(secretKey)) {
            creds = StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey));
            log.debug("TextractStagingService using static credentials");
        } else {
            creds = DefaultCredentialsProvider.create();
            log.debug("TextractStagingService using default credentials chain");
        }

        this.s3 = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(creds)
                // NO endpointOverride - connects to real AWS S3
                // NO pathStyleAccessEnabled - uses standard virtual-hosted style
                .build();

        log.info("TextractStagingService initialized: bucket={}, prefix={}, deleteAfter={}, region={}",
                bucket, this.prefix, deleteAfter, region);
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }

    /**
     * Upload bytes to the staging bucket.
     *
     * @param key         Object key (prefix will be prepended)
     * @param data        File bytes
     * @param contentType MIME type
     */
    public void upload(String key, byte[] data, String contentType) {
        String fullKey = prefix + key;
        log.debug("Uploading to staging: bucket={}, key={}, size={}", bucket, fullKey, data.length);

        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucket)
                .key(fullKey)
                .contentType(contentType)
                .build();

        s3.putObject(request, RequestBody.fromBytes(data));
        log.debug("Upload complete: {}", fullKey);
    }

    /**
     * Delete an object from the staging bucket.
     *
     * @param key Object key (prefix will be prepended)
     */
    public void delete(String key) {
        if (!deleteAfter) {
            log.debug("Skipping delete (deleteAfter=false): {}", key);
            return;
        }

        String fullKey = prefix + key;
        log.debug("Deleting from staging: bucket={}, key={}", bucket, fullKey);

        try {
            DeleteObjectRequest request = DeleteObjectRequest.builder()
                    .bucket(bucket)
                    .key(fullKey)
                    .build();

            s3.deleteObject(request);
            log.debug("Delete complete: {}", fullKey);
        } catch (S3Exception e) {
            // Log but don't fail - staging cleanup is best-effort
            log.warn("Failed to delete staging object {}: {}", fullKey, e.getMessage());
        }
    }

    /**
     * Get the bucket name.
     */
    public String getBucket() {
        return bucket;
    }

    /**
     * Get the full S3 key for a given object key.
     */
    public String getFullKey(String key) {
        return prefix + key;
    }

    /**
     * Check if staging is enabled (bucket is configured).
     */
    public boolean isEnabled() {
        return bucket != null && !bucket.isBlank();
    }

    @PreDestroy
    public void close() {
        try {
            s3.close();
            log.debug("TextractStagingService S3 client closed");
        } catch (Exception ignored) {
            // Ignore close errors
        }
    }
}
