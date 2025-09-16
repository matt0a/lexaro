package com.lexaro.api.storage;

import java.util.Map;

//@Component
public class NoopStorageService implements StorageService {

    @Override
    public PresignedUpload presignPut(String objectKey, String contentType, long contentLength, int expiresSeconds) {
        throw new IllegalStateException("Storage provider is disabled (noop).");
    }

    @Override
    public PresignedDownload presignGet(String objectKey, int expiresSeconds) {
        // Never used in NOOP; just return a harmless stub or throw.
        return new PresignedDownload("https://example.invalid/noop", Map.of(), expiresSeconds);
    }

    @Override public boolean exists(String objectKey) { return false; }
    @Override public long size(String objectKey) { return 0L; }
    @Override public void delete(String objectKey) { /* no-op */ }
}
