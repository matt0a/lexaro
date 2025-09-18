package com.lexaro.api.storage;

import java.util.Map;

public interface StorageService {

    // Upload presign
    record PresignedUpload(String url, Map<String, String> headers, int expiresInSeconds) {}

    // Download presign (no TTL field here; your controller/service can pass back the TTL used)
    record PresignedDownload(String url, Map<String, String> headers) {}

    PresignedUpload presignPut(String objectKey, String contentType, long contentLength, int expiresSeconds);

    // Simple GET presign (no overrides)
    PresignedDownload presignGet(String objectKey, int expiresSeconds);

    // GET presign with overrides INCLUDED IN THE SIGNATURE
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
