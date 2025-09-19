package com.lexaro.api.extract;

/** Low-level extractor for a single format. */
public interface ContentExtractor {
    /**
     * @param bytes     raw file bytes
     * @param maxPages  if > 0, limit paged formats to this many pages.
     */
    String extract(byte[] bytes, int maxPages) throws Exception;
}
