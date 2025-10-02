package com.lexaro.api.storage;

import java.util.Map;

public interface StorageService {

    // Upload presign
    record PresignedUpload(String url, Map<String, String> headers, int expiresInSeconds) {}

    // Download presign
    record PresignedDownload(String url, Map<String, String> headers) {}

    // PUT presign: note there is NO content-length here (MinIO dislikes that)
    PresignedUpload presignPut(String objectKey, String contentType, int expiresSeconds);

    // Simple GET presign
    PresignedDownload presignGet(String objectKey, int expiresSeconds);

    // GET presign with response overrides (these are part of the signature)
    PresignedDownload presignGet(String objectKey,
                                 int expiresSeconds,
                                 String responseContentType,
                                 String responseContentDisposition);

    boolean exists(String objectKey);
    long size(String objectKey);
    void delete(String objectKey);

    byte[] getBytes(String objectKey);
    void put(String objectKey, byte[] bytes, String contentType);
}
