package com.lexaro.api.storage;

import java.util.Map;

public interface StorageService {
    record PresignedUpload(String url, Map<String,String> headers, int expiresInSeconds) {}

    PresignedUpload presignPut(String objectKey, String contentType, long contentLength, int expiresSeconds);

    boolean exists(String objectKey);

    long size(String objectKey);

    void delete(String objectKey);

    PresignedDownload presignGet(String objectKey, int expiresSeconds);
}
