package com.lexaro.api.storage;

import java.util.Map;

/** Disabled storage used when provider = noop. */
public class NoopStorageService implements StorageService {

    @Override
    public PresignedUpload presignPut(String objectKey, String contentType, long contentLength, int expiresSeconds) {
        throw new IllegalStateException("Storage provider is disabled (noop).");
    }

    @Override
    public PresignedDownload presignGet(String objectKey, int expiresSeconds) {
        return new PresignedDownload("https://example.invalid/noop", Map.of());
    }

    @Override
    public PresignedDownload presignGet(String objectKey,
                                        int expiresSeconds,
                                        String responseContentType,
                                        String responseContentDisposition) {
        return new PresignedDownload("https://example.invalid/noop", Map.of());
    }

    @Override public boolean exists(String objectKey) { return false; }
    @Override public long size(String objectKey) { return 0L; }
    @Override public void delete(String objectKey) { /* no-op */ }

    @Override
    public byte[] getBytes(String objectKey) {
        throw new IllegalStateException("NOOP storage: getBytes() not supported");
    }

    @Override
    public void put(String objectKey, byte[] bytes, String contentType) {
        throw new IllegalStateException("NOOP storage: put() not supported");
    }
}
