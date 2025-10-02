package com.lexaro.api.storage;

import org.springframework.beans.factory.annotation.Value;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.net.URI;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

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
                .pathStyleAccessEnabled(true) // MinIO-friendly
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
                .endpointOverride(URI.create(endpoint))
                .serviceConfiguration(s3cfg) // if your SDK complains, you can remove this line
                .build();

        this.bucket = bucket;
    }

    @Override
    public PresignedUpload presignPut(String objectKey, String contentType, int expiresSeconds) {
        var putReq = PutObjectRequest.builder()
                .bucket(bucket)
                .key(objectKey)
                .contentType(contentType)   // include content-type in signature; browsers will send it
                .build();

        var presignReq = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofSeconds(expiresSeconds))
                .putObjectRequest(putReq)
                .build();

        PresignedPutObjectRequest preq = presigner.presignPutObject(presignReq);

        // Flatten headers (List<String> -> comma-joined String) to make life easy for the caller
        Map<String, String> headers = preq.signedHeaders().entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        e -> String.join(",", e.getValue()),
                        (a, b) -> b,
                        LinkedHashMap::new
                ));

        return new PresignedUpload(preq.url().toString(), headers, expiresSeconds);
    }

    @Override
    public PresignedDownload presignGet(String objectKey, int expiresSeconds) {
        var getReq = GetObjectRequest.builder()
                .bucket(bucket)
                .key(objectKey)
                .build();

        var presign = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofSeconds(expiresSeconds))
                .getObjectRequest(getReq)
                .build();

        var preq = presigner.presignGetObject(presign);
        return new PresignedDownload(preq.url().toString(), Map.of());
    }

    @Override
    public PresignedDownload presignGet(String objectKey,
                                        int expiresSeconds,
                                        String responseContentType,
                                        String responseContentDisposition) {
        var get = GetObjectRequest.builder()
                .bucket(bucket)
                .key(objectKey)
                .responseContentType((responseContentType == null || responseContentType.isBlank()) ? null : responseContentType)
                .responseContentDisposition((responseContentDisposition == null || responseContentDisposition.isBlank()) ? null : responseContentDisposition)
                .build();

        var presign = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofSeconds(expiresSeconds))
                .getObjectRequest(get)
                .build();

        var preq = presigner.presignGetObject(presign);
        return new PresignedDownload(preq.url().toString(), Map.of());
    }

    @Override
    public boolean exists(String objectKey) {
        try {
            s3.headObject(HeadObjectRequest.builder().bucket(bucket).key(objectKey).build());
            return true;
        } catch (NoSuchKeyException e) { // modeled exception (sometimes not thrown by head)
            return false;
        } catch (S3Exception e) {
            if (e.statusCode() == 404) return false;
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
        s3.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(objectKey).build());
    }

    @Override
    public byte[] getBytes(String objectKey) {
        var resp = s3.getObjectAsBytes(b -> b.bucket(bucket).key(objectKey));
        return resp.asByteArray();
    }

    @Override
    public void put(String objectKey, byte[] bytes, String contentType) {
        s3.putObject(
                b -> b.bucket(bucket).key(objectKey).contentType(contentType),
                RequestBody.fromBytes(bytes)
        );
    }
}
