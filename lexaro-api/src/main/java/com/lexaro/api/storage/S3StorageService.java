package com.lexaro.api.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.exception.SdkClientException;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.net.URI;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class S3StorageService implements StorageService {

    private final S3Client s3;
    private final S3Presigner presigner;
    private final String bucket;

    public S3StorageService(
            @Value("${app.storage.bucket}") String bucket,
            @Value("${app.storage.endpoint}") String endpoint,
            @Value("${app.storage.accessKey}") String accessKey,
            @Value("${app.storage.secretKey}") String secretKey,
            @Value("${app.storage.region:us-east-1}") String region
    ) {
        var creds = StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey));
        var s3cfg = S3Configuration.builder()
                .pathStyleAccessEnabled(true)   // ✅ force path style (bucket in path)
                .build();

        this.s3 = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(creds)
                .serviceConfiguration(s3cfg)
                .endpointOverride(URI.create(endpoint))
                .build();

        this.presigner = S3Presigner.builder()
                .region(Region.of(region))
                .credentialsProvider(creds)
                .serviceConfiguration(s3cfg)     // ✅ add this line
                .endpointOverride(URI.create(endpoint))
                .build();

        this.bucket = bucket;
    }

    @Override
    public PresignedUpload presignPut(String objectKey, String contentType, long contentLength, int expiresSeconds) {
        var put = PutObjectRequest.builder()
                .bucket(bucket)
                .key(objectKey)
                .contentType(contentType)
                .contentLength(contentLength)
                .build();

        var presign = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofSeconds(expiresSeconds))
                .putObjectRequest(put)
                .build();

        PresignedPutObjectRequest preq = presigner.presignPutObject(presign);

        // Flatten signed headers and ensure Content-Type is present for the client PUT call.
        Map<String, String> headers = preq.signedHeaders().entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        e -> String.join(",", e.getValue()),
                        (a, b) -> b,
                        LinkedHashMap::new
                ));
        headers.putIfAbsent("Content-Type", contentType);

        return new PresignedUpload(preq.url().toString(), headers, expiresSeconds);
    }

    @Override
    public boolean exists(String objectKey) {
        try {
            s3.headObject(HeadObjectRequest.builder().bucket(bucket).key(objectKey).build());
            return true;
        } catch (NoSuchKeyException e) {
            return false;
        } catch (S3Exception e) {
            if (e.statusCode() == 404) return false;
            throw e;
        } catch (SdkClientException e) { // connectivity, etc.
            throw e;
        }
    }

    @Override
    public long size(String objectKey) {
        var head = s3.headObject(HeadObjectRequest.builder().bucket(bucket).key(objectKey).build());
        return head.contentLength();
    }

    @Override
    public void delete(String objectKey) {
        s3.deleteObject(b -> b.bucket(bucket).key(objectKey));
    }
}
