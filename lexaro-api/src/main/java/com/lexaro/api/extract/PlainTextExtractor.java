package com.lexaro.api.extract;

import java.nio.charset.StandardCharsets;

public class PlainTextExtractor implements ContentExtractor {
    @Override
    public String extract(byte[] bytes, int maxPages) {
        return new String(bytes, StandardCharsets.UTF_8).trim();
    }
}