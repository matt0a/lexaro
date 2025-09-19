package com.lexaro.api.extract;

/**
 * High-level text extraction entry point (router by MIME type).
 *
 * Notes for PDF (PDFBox 3.x):
 *  - Paged formats honor {@code maxPages}. A value <= 0 means "all pages".
 *  - Implementations should return an empty string when nothing can be read,
 *    and throw an Exception for truly unsupported/corrupt inputs.
 */
public interface TextExtractor {

    /**
     * Extract plain text from the given content using its MIME type.
     *
     * @param mime      IANA content type (e.g., "application/pdf", "text/plain",
     *                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
     * @param bytes     raw file bytes
     * @param maxPages  for paged formats (PDF/DOCX). {@code <= 0} means all pages.
     * @return          extracted text (never {@code null}; may be empty)
     * @throws Exception on fatal parse/extraction errors
     */
    String extract(String mime, byte[] bytes, int maxPages) throws Exception;

    /** Convenience overload: extract all pages. */
    default String extract(String mime, byte[] bytes) throws Exception {
        return extract(mime, bytes, 0);
    }
}
