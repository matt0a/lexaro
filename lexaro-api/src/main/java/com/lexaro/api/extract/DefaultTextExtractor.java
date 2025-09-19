package com.lexaro.api.extract;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

public class DefaultTextExtractor implements TextExtractor {

    private final Map<String, ContentExtractor> byMime;

    public DefaultTextExtractor(Map<String, ContentExtractor> byMime) {
        this.byMime = byMime;
    }

    /** Prewired defaults for PDF, DOCX, TXT. */
    public static DefaultTextExtractor withDefaults() {
        Map<String, ContentExtractor> m = new HashMap<>();

        ContentExtractor pdf  = new PdfTextExtractor();      // PDFBox 3.x
        ContentExtractor txt  = new PlainTextExtractor();     // simple UTF-8
        ContentExtractor docx = new DocxTextExtractor();      // Apache POI XWPF

        // PDF
        m.put("application/pdf",  pdf);
        m.put("application/x-pdf", pdf);

        // DOCX
        m.put("application/vnd.openxmlformats-officedocument.wordprocessingml.document", docx);

        // TXT
        m.put("text/plain", txt);

        return new DefaultTextExtractor(m);
    }

    /** Add/override a mapping. */
    public DefaultTextExtractor map(String mime, ContentExtractor extractor) {
        byMime.put(mime.toLowerCase(Locale.ROOT), extractor);
        return this;
    }

    @Override
    public String extract(String mime, byte[] bytes, int maxPages) throws Exception {
        String key = mime == null ? "" : mime.toLowerCase(Locale.ROOT).trim();

        // direct match
        ContentExtractor extractor = byMime.get(key);
        if (extractor != null) {
            return extractor.extract(bytes, maxPages);
        }

        // fallbacks
        if (key.startsWith("text/")) {
            return new PlainTextExtractor().extract(bytes, maxPages);
        }
        if (key.endsWith("+xml") || key.contains("xml")) {
            return new PlainTextExtractor().extract(bytes, maxPages);
        }

        throw new UnsupportedOperationException("Unsupported MIME: " + mime);
    }
}