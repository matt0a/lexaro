package com.lexaro.api.storage;

import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class NoopStorageService implements StorageService {
    @Override
    public PresignedUpload presignPut(String objectKey, String contentType, long contentLength, int expiresSeconds) {
        // Useful error message if someone tries to use presign while provider=noop
        throw new IllegalStateException("Storage provider is 'noop'. Switch app.storage.provider=s3 to use presigned uploads.");
    }
    @Override public boolean exists(String objectKey) { return false; }
    @Override public long size(String objectKey) { return 0; }
    @Override public void delete(String objectKey) { /* no-op */ }
}
