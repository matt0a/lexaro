package com.lexaro.api.extract;

import com.lexaro.api.extract.ocr.OcrService;
import com.lexaro.api.extract.ocr.TextractOcrService;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.UUID;

import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.hwpf.HWPFDocument;
import org.apache.poi.hwpf.extractor.WordExtractor;

/**
 * Primary text extractor service.
 *
 * Handles multiple formats:
 * - TEXT/* (txt, md, csv, json) - UTF-8 decode
 * - DOCX - Apache POI
 * - DOC (legacy) - Apache POI
 * - PDF - PDFBox native text, with Textract OCR fallback for scanned documents
 * - IMAGE/* - OCR via Textract sync API
 *
 * For multi-page scanned PDFs:
 * - Uses async Textract with S3 staging (if configured)
 * - Falls back to page-by-page sync OCR if async not available
 */
@Slf4j
@Primary
@Service
public class DefaultTextExtractor implements TextExtractor {

    // Limits / toggles
    @Value("${app.extract.pdf.maxPages:200}")
    private int pdfMaxPages;

    @Value("${app.extract.ocr.enabled:true}")
    private boolean ocrEnabled;

    @Value("${app.extract.ocr.maxPages:50}")
    private int ocrMaxPages;

    @Value("${app.extract.ocr.dpi:300}")
    private int ocrDpi;

    // Injected services
    private final OcrService ocrService;
    private final TextractOcrService textractService;

    /**
     * Constructor injection.
     * TextractOcrService is optional - if not available, async mode won't work.
     * OcrService is used for sync OCR (images, single pages).
     */
    public DefaultTextExtractor(
            @Autowired(required = false) OcrService ocrService,
            @Autowired(required = false) TextractOcrService textractService) {
        this.ocrService = ocrService;
        this.textractService = textractService;
    }

    @PostConstruct
    void init() {
        String providerName = ocrService != null ? ocrService.name() : "none";
        boolean asyncEnabled = textractService != null && textractService.isAsyncEnabled();
        log.info("DefaultTextExtractor initialized: ocrEnabled={}, ocrProvider={}, asyncTextract={}, dpi={}, maxPages={}",
                ocrEnabled, providerName, asyncEnabled, ocrDpi, ocrMaxPages);
    }

    @Override
    public String extract(String mime, byte[] bytes, int maxPages) throws Exception {
        final String m = (mime == null) ? "" : mime.toLowerCase(Locale.ROOT);

        // --- TEXT/* (txt, md, csv, json as text) ---
        if (m.startsWith("text/") || m.equals("application/json")) {
            String raw = new String(bytes, StandardCharsets.UTF_8);
            String norm = normalize(raw);
            log.debug("TEXT extractor: mime={} chars={}", m, norm.length());
            return norm;
        }

        // --- DOCX ---
        if (m.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document")) {
            try (var in = new ByteArrayInputStream(bytes);
                 var doc = new XWPFDocument(in);
                 var extractor = new XWPFWordExtractor(doc)) {
                String norm = normalize(extractor.getText());
                log.debug("DOCX extractor: chars={}", norm.length());
                return norm;
            }
        }

        // --- legacy DOC ---
        if (m.equals("application/msword")) {
            try (var in = new ByteArrayInputStream(bytes);
                 var doc = new HWPFDocument(in);
                 var extractor = new WordExtractor(doc)) {
                String norm = normalize(extractor.getText());
                log.debug("DOC extractor: chars={}", norm.length());
                return norm;
            }
        }

        // --- PDF ---
        if (m.startsWith("application/pdf")) {
            return extractPdf(bytes, maxPages);
        }

        // --- Image/* (OCR) ---
        if (m.startsWith("image/")) {
            return extractImage(bytes, m);
        }

        // Unknown format
        log.debug("Extractor: unsupported mime '{}' -> returning empty string", m);
        return "";
    }

    /**
     * Extract text from PDF.
     * Tries native text first, falls back to OCR for scanned documents.
     */
    private String extractPdf(byte[] bytes, int maxPages) throws Exception {
        try (PDDocument doc = Loader.loadPDF(bytes)) {
            int total = doc.getNumberOfPages();
            int limit = Math.min(total, pdfMaxPages);
            if (maxPages > 0) limit = Math.min(limit, maxPages);

            // 1) Try native text extraction first (for text-based PDFs)
            var stripper = new PDFTextStripper();
            stripper.setStartPage(1);
            stripper.setEndPage(limit);
            String nativeText = normalize(stripper.getText(doc));
            if (!nativeText.isBlank()) {
                log.debug("PDF native text found (pages={}, chars={})", limit, nativeText.length());
                return nativeText;
            }

            // 2) OCR fallback for scanned PDFs
            if (!ocrEnabled || ocrService == null) {
                log.debug("PDF has no native text and OCR is disabled");
                return "";
            }

            int ocrPages = Math.min(limit, ocrMaxPages);

            // 3) Multi-page PDF with async Textract available → use async path
            if (total > 1 && textractService != null && textractService.isAsyncEnabled()) {
                log.info("Using async Textract for multi-page PDF: {} pages", total);
                String documentId = UUID.randomUUID().toString();
                String text = normalize(textractService.ocrPdfAsync(bytes, documentId));
                log.debug("Async Textract result: {} chars", text.length());
                return text;
            }

            // 4) Single page or no async → page-by-page sync OCR
            log.debug("Using sync OCR for PDF: {} pages", ocrPages);
            return ocrPdfPageByPage(doc, ocrPages);
        }
    }

    /**
     * OCR PDF page by page using sync Textract.
     * Used for single-page PDFs or when async is not available.
     */
    private String ocrPdfPageByPage(PDDocument doc, int ocrPages) throws Exception {
        StringBuilder sb = new StringBuilder(ocrPages * 800);

        for (int i = 0; i < ocrPages; i++) {
            long pageStart = System.nanoTime();

            // Render PDF page to image
            BufferedImage page = PdfRender.render(doc, i, ocrDpi);

            // OCR the page image
            String text = normalize(ocrService.ocr(page, null));

            long tookMs = (System.nanoTime() - pageStart) / 1_000_000;
            log.debug("OCR page {} chars={} tookMs={}", (i + 1), text.length(), tookMs);

            if (!text.isBlank()) {
                if (sb.length() > 0) sb.append("\n\n");
                sb.append(text);
            }
        }

        log.info("Sync OCR summary (PDF): pages={}, totalChars={}", ocrPages, sb.length());
        return sb.toString();
    }

    /**
     * Extract text from image using sync OCR.
     */
    private String extractImage(byte[] bytes, String mime) throws Exception {
        if (!ocrEnabled || ocrService == null) {
            log.debug("Image uploaded but OCR is disabled");
            return "";
        }

        BufferedImage img = ImageIO.read(new ByteArrayInputStream(bytes));
        if (img == null) {
            log.warn("Could not decode image (mime={})", mime);
            return "";
        }

        long t0 = System.nanoTime();
        String text = normalize(ocrService.ocr(img, null));
        long tookMs = (System.nanoTime() - t0) / 1_000_000;

        log.debug("Image OCR: chars={} tookMs={}", text.length(), tookMs);
        return text;
    }

    /**
     * Normalize whitespace and control characters in extracted text.
     */
    private static String normalize(String s) {
        if (s == null) return "";
        String t = s.replace("\r\n", "\n").replace("\r", "\n")
                .replaceAll("[\\p{Cntrl}&&[^\\r\\n\\t]]", " ");
        t = t.replaceAll("[ \\t\\f\\x0B\\u00A0]+", " ")
                .replaceAll(" *\\n *", "\n")
                .replaceAll("\\n{3,}", "\n\n")
                .trim();
        return t;
    }

    /**
     * Helper class for PDF page rendering.
     */
    private static class PdfRender {
        static BufferedImage render(PDDocument doc, int pageIndex, int dpi) throws Exception {
            var renderer = new org.apache.pdfbox.rendering.PDFRenderer(doc);
            return renderer.renderImageWithDPI(pageIndex, dpi, org.apache.pdfbox.rendering.ImageType.RGB);
        }
    }
}
