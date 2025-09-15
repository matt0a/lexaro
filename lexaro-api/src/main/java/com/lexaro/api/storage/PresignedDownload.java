package com.lexaro.api.storage;

import java.util.Map;

public record PresignedDownload(String url, Map<String,String> headers, int expiresInSeconds) {}
