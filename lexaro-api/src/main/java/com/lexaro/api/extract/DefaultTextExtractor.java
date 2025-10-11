package com.lexaro.api.extract;

import com.lexaro.api.extract.ocr.*;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

// NEW: POI (docx + optional doc)
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.hwpf.HWPFDocument;            // optional
import org.apache.poi.hwpf.extractor.WordExtractor; // optional

@Slf4j
@Primary
@Service
public class DefaultTextExtractor implements TextExtractor {

    // Limits / toggles
    @Value("${app.extract.pdf.maxPages:200}") private int pdfMaxPages;
    @Value("${app.extract.ocr.enabled:true}") private boolean ocrEnabled;
    @Value("${app.extract.ocr.maxPages:50}") private int ocrMaxPages;
    @Value("${app.extract.ocr.dpi:300}") private int ocrDpi;
    @Value("${app.extract.ocr.langs:eng}") private String ocrLangs;
    @Value("${app.extract.ocr.tessdataDir:}") private String tessdataDir;

    // Heuristics + preprocessing
    @Value("${app.extract.ocr.psm:6}") private int ocrPsm;
    @Value("${app.extract.ocr.maxLongEdgePx:5000}") private int maxLongEdgePx;
    @Value("${app.extract.ocr.preprocess:true}") private boolean preprocess;

    // If Tess returns fewer than this many chars, still try neural
    @Value("${app.extract.ocr.tessUnderCharsForNeural:100}") private int tessUnderCharsForNeural;

    // Neural sidecar
    @Value("${app.extract.ocr.neural.enabled:false}") private boolean neuralEnabled;
    @Value("${app.extract.ocr.neural.baseUrl:http://localhost:6060}") private String neuralBaseUrl;
    @Value("${app.extract.ocr.neural.timeoutMs:45000}") private int neuralTimeoutMs;
    /** If true, when Tess looked weak/short, take neural if it returns anything non-blank. */
    @Value("${app.extract.ocr.neural.preferIfNotBlank:true}") private boolean preferNeuralIfNotBlank;
    @Value("${app.extract.ocr.neural.tryRotations:true}") private boolean neuralTryRotations;
    @Value("${app.extract.ocr.neural.maxVariants:3}") private int neuralMaxVariants;

    // Optional: dump what we actually send to OCR engines
    @Value("${app.extract.ocr.debugDir:}") private String debugDir;

    // Page-level heuristics
    private static final int MIN_CHARS_PER_PAGE = 120;
    private static final double MIN_ALPHA_SHARE  = 0.55;

    private OcrService tesseract;
    private OcrService neural; // optional

    @PostConstruct
    void init() {
        this.tesseract = new Tess4jOcrService(tessdataDir, ocrPsm, ocrDpi);
        if (neuralEnabled) this.neural = new NeuralOcrService(neuralBaseUrl, neuralTimeoutMs);
        log.info(
                "OCR init: enabled={}, langs={}, neuralEnabled={}, dpi={}, psm={}, preprocess={}, preferNeuralIfNotBlank={}, tessUnderCharsForNeural={}, tryRotations={}, maxVariants={}",
                ocrEnabled, ocrLangs, neuralEnabled, ocrDpi, ocrPsm, preprocess, preferNeuralIfNotBlank,
                tessUnderCharsForNeural, neuralTryRotations, neuralMaxVariants
        );
    }

    @Override
    public String extract(String mime, byte[] bytes, int maxPages) throws Exception {
        final String m = (mime == null) ? "" : mime.toLowerCase(Locale.ROOT);

        /* ---------- TEXT/* (txt, md, csv, json as text) ---------- */
        if (m.startsWith("text/") || m.equals("application/json")) {
            String raw = new String(bytes, StandardCharsets.UTF_8);
            String norm = normalize(raw);
            log.debug("TEXT extractor: mime={} chars={}", m, norm.length());
            return norm;
        }

        /* ---------- DOCX ---------- */
        if (m.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document")) {
            try (var in = new ByteArrayInputStream(bytes);
                 var doc = new XWPFDocument(in);
                 var extractor = new XWPFWordExtractor(doc)) {
                String norm = normalize(extractor.getText());
                log.debug("DOCX extractor: chars={}", norm.length());
                return norm;
            }
        }

        /* ---------- legacy DOC (optional if you include poi) ---------- */
        if (m.equals("application/msword")) {
            try (var in = new ByteArrayInputStream(bytes);
                 var doc = new HWPFDocument(in);
                 var extractor = new WordExtractor(doc)) {
                String norm = normalize(extractor.getText());
                log.debug("DOC extractor: chars={}", norm.length());
                return norm;
            }
        }

        /* ---------- PDF ---------- */
        if (m.startsWith("application/pdf")) {
            try (PDDocument doc = Loader.loadPDF(bytes)) {
                int total = doc.getNumberOfPages();
                int limit = Math.min(total, pdfMaxPages);
                if (maxPages > 0) limit = Math.min(limit, maxPages);

                // 1) Native text
                var stripper = new PDFTextStripper();
                stripper.setStartPage(1);
                stripper.setEndPage(limit);
                String nativeText = normalize(stripper.getText(doc));
                if (!nativeText.isBlank()) {
                    log.debug("PDF native text found (pages={}, chars={})", limit, nativeText.length());
                    return nativeText;
                }

                // 2) OCR fallback
                if (!ocrEnabled) return "";
                int ocrPages = Math.min(limit, ocrMaxPages);
                StringBuilder sb = new StringBuilder(ocrPages * 800);
                int usedNeural = 0, usedTess = 0;

                for (int i = 0; i < ocrPages; i++) {
                    long pageStart = System.nanoTime();

                    BufferedImage page = PdfRender.render(doc, i, ocrDpi);
                    page = guardAndDownscale(page);
                    dumpDebug(page, "pdf", i, "base");

                    String tess = normalize(ocrWithRetries(page, ocrLangs, i));
                    int tessLen = tess.strip().length();
                    boolean weak = OcrHeuristics.looksWeak(tess, MIN_CHARS_PER_PAGE, MIN_ALPHA_SHARE);
                    boolean shouldTryNeural = neuralEnabled && neural != null && (weak || tessLen < tessUnderCharsForNeural);

                    log.debug("Tess decision [pdf page {}]: len={}, weak={}, thresholdLen<{}={}",
                            (i + 1), tessLen, weak, tessUnderCharsForNeural, (tessLen < tessUnderCharsForNeural));

                    String chosen = tess;

                    if (shouldTryNeural) {
                        String neuralBest = neuralTryVariants(page, i);
                        int nLen = neuralBest.strip().length();
                        boolean takeNeural = (nLen > 0) && (preferNeuralIfNotBlank || nLen > tessLen);

                        log.debug("Neural decision [pdf page {}]: tessLen={}, weak={}, nLen={}, preferIfNotBlank={}, takeNeural={}",
                                (i + 1), tessLen, weak, nLen, preferNeuralIfNotBlank, takeNeural);

                        if (takeNeural) { chosen = neuralBest; usedNeural++; }
                        else { usedTess++; }
                    } else {
                        usedTess++;
                    }

                    long tookMs = (System.nanoTime() - pageStart) / 1_000_000;
                    log.debug("Page {} chosen={} chars, tookMs={}", (i + 1), chosen.strip().length(), tookMs);

                    if (!chosen.isBlank()) {
                        if (sb.length() > 0) sb.append("\n\n");
                        sb.append(chosen);
                    }
                }

                log.info("OCR summary (PDF): pages={}, tess={}, neural={}, dpi={}", ocrPages, usedTess, usedNeural, ocrDpi);
                return sb.toString();
            }
        }

        /* ---------- Image/* (OCR) ---------- */
        if (m.startsWith("image/")) {
            BufferedImage img = ImageIO.read(new ByteArrayInputStream(bytes));
            if (img == null) return "";
            img = guardAndDownscale(img);
            dumpDebug(img, "image", 0, "base");

            String tess = normalize(ocrWithRetries(img, ocrLangs, 0));
            int tessLen = tess.strip().length();
            boolean weak = OcrHeuristics.looksWeak(tess, Math.max(80, MIN_CHARS_PER_PAGE / 2), MIN_ALPHA_SHARE);

            log.debug("Tess decision [image]: len={}, weak={}, thresholdLen<{}={}",
                    tessLen, weak, tessUnderCharsForNeural, (tessLen < tessUnderCharsForNeural));

            String chosen = tess;

            if (neuralEnabled && neural != null && (weak || tessLen < tessUnderCharsForNeural)) {
                String nBest = neuralTryVariants(img, 0);
                int nLen = nBest.strip().length();
                boolean takeNeural = (nLen > 0) && (preferNeuralIfNotBlank || nLen > tessLen);

                log.debug("Neural decision [image]: tessLen={}, weak={}, nLen={}, preferIfNotBlank={}, takeNeural={}",
                        tessLen, weak, nLen, preferNeuralIfNotBlank, takeNeural);

                if (takeNeural) chosen = nBest;
            }
            return chosen;
        }

        // Unknown → empty string signals "nothing to read"
        log.debug("Extractor: unsupported mime '{}' -> returning empty string", m);
        return "";
    }

    /** Downscale very large images and convert to grayscale for Tess; neural gets RGB via ensureRgb(). */
    private BufferedImage guardAndDownscale(BufferedImage src) {
        int w = src.getWidth(), h = src.getHeight();
        int longEdge = Math.max(w, h);
        if (longEdge <= maxLongEdgePx) return ImagePreprocess.toGray(src);

        double scale = maxLongEdgePx / (double) longEdge;
        int nw = Math.max(1, (int) Math.round(w * scale));
        int nh = Math.max(1, (int) Math.round(h * scale));
        BufferedImage out = new BufferedImage(nw, nh, BufferedImage.TYPE_BYTE_GRAY);
        Graphics2D g = out.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g.drawImage(src, 0, 0, nw, nh, null);
        g.dispose();
        return out;
    }

    /** Ensure RGB-like (TYPE_3BYTE_BGR) for neural OCR. */
    private static BufferedImage ensureRgb(BufferedImage src) {
        if (src.getType() == BufferedImage.TYPE_3BYTE_BGR) return src;
        BufferedImage out = new BufferedImage(src.getWidth(), src.getHeight(), BufferedImage.TYPE_3BYTE_BGR);
        Graphics2D g = out.createGraphics();
        g.drawImage(src, 0, 0, null);
        g.dispose();
        return out;
    }

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

    private static class PdfRender {
        static BufferedImage render(PDDocument doc, int pageIndex, int dpi) throws Exception {
            var renderer = new org.apache.pdfbox.rendering.PDFRenderer(doc);
            return renderer.renderImageWithDPI(pageIndex, dpi, org.apache.pdfbox.rendering.ImageType.GRAY);
        }
    }

    /** Try several PSMs then 90°/180°/270° rotations; return first non-weak or the longest. */
    private String ocrWithRetries(BufferedImage page, String langs, int pageIndex) {
        long t0 = System.nanoTime();
        BufferedImage work = preprocess ? ImagePreprocess.otsuBinarize(page) : page;
        dumpDebug(work, "tess", pageIndex, "work");

        int[] ladder = new int[]{ ocrPsm, 4, 3, 1 };
        String best = "";
        for (int psm : ladder) {
            long ps = System.nanoTime();
            String txt = (tesseract instanceof Tess4jOcrService t)
                    ? t.ocrWithPsm(work, langs, psm)
                    : tesseract.ocr(work, langs);
            txt = normalize(txt);
            int len = txt.strip().length();
            boolean weak = OcrHeuristics.looksWeak(txt, MIN_CHARS_PER_PAGE, MIN_ALPHA_SHARE);
            long took = (System.nanoTime() - ps) / 1_000_000;
            log.debug("Tess PSM={} => len={}, weak={}, tookMs={}", psm, len, weak, took);

            if (!weak) {
                log.debug("Tess accepted at PSM={} (len={}), ladder tookMs={}", psm, len, (System.nanoTime() - t0) / 1_000_000);
                return txt;
            }
            if (len > best.length()) best = txt;
        }

        // Rotations (PSM=1)
        BufferedImage r90  = ImagePreprocess.rotate90(work);
        BufferedImage r180 = ImagePreprocess.rotate90(ImagePreprocess.rotate90(work));
        BufferedImage r270 = ImagePreprocess.rotate90(ImagePreprocess.rotate90(ImagePreprocess.rotate90(work)));

        String rot90  = normalize((tesseract instanceof Tess4jOcrService t1) ? t1.ocrWithPsm(r90,  langs, 1) : tesseract.ocr(r90,  langs));
        String rot180 = normalize((tesseract instanceof Tess4jOcrService t2) ? t2.ocrWithPsm(r180, langs, 1) : tesseract.ocr(r180, langs));
        String rot270 = normalize((tesseract instanceof Tess4jOcrService t3) ? t3.ocrWithPsm(r270, langs, 1) : tesseract.ocr(r270, langs));

        if (!OcrHeuristics.looksWeak(rot90,  MIN_CHARS_PER_PAGE, MIN_ALPHA_SHARE))  { log.debug("Tess accepted at rotation 90°");  return rot90;  }
        if (!OcrHeuristics.looksWeak(rot180, MIN_CHARS_PER_PAGE, MIN_ALPHA_SHARE))  { log.debug("Tess accepted at rotation 180°"); return rot180; }
        if (!OcrHeuristics.looksWeak(rot270, MIN_CHARS_PER_PAGE, MIN_ALPHA_SHARE))  { log.debug("Tess accepted at rotation 270°"); return rot270; }

        String longest = best;
        if (rot90.length()  > longest.length()) longest = rot90;
        if (rot180.length() > longest.length()) longest = rot180;
        if (rot270.length() > longest.length()) longest = rot270;

        log.debug("Tess ladder total tookMs={}, returning best len={}",
                (System.nanoTime() - t0) / 1_000_000, longest.length());
        return longest;
    }

    /** Call neural on a few variants (RGB / binarized / rotations), pick best (or early exit if non-blank). */
    private String neuralTryVariants(BufferedImage page, int pageIndex) {
        if (!neuralEnabled || neural == null) return "";
        long t0 = System.nanoTime();

        List<BufferedImage> variants = new ArrayList<>();
        variants.add(ensureRgb(page));
        if (preprocess) variants.add(ensureRgb(ImagePreprocess.otsuBinarize(page)));

        if (neuralTryRotations) {
            BufferedImage r90  = ImagePreprocess.rotate90(page);
            BufferedImage r180 = ImagePreprocess.rotate90(ImagePreprocess.rotate90(page));
            BufferedImage r270 = ImagePreprocess.rotate90(ImagePreprocess.rotate90(ImagePreprocess.rotate90(page)));

            variants.add(ensureRgb(r90));
            variants.add(ensureRgb(r180));
            variants.add(ensureRgb(r270));

            if (preprocess) {
                variants.add(ensureRgb(ImagePreprocess.otsuBinarize(r90)));
                variants.add(ensureRgb(ImagePreprocess.otsuBinarize(r180)));
                variants.add(ensureRgb(ImagePreprocess.otsuBinarize(r270)));
            }
        }

        String best = "";
        int tried = 0;
        for (BufferedImage v : variants) {
            if (tried >= Math.max(1, neuralMaxVariants)) break;
            dumpDebug(v, "neural", pageIndex, "v" + (tried + 1));

            long vs = System.nanoTime();
            String out = normalize(neural.ocr(v, mapLangsForEasyOcr(ocrLangs)));
            int nLen = out.strip().length();
            long took = (System.nanoTime() - vs) / 1_000_000;
            log.debug("Neural variant #{} => len={}, tookMs={}", (tried + 1), nLen, took);

            if (nLen > best.length()) best = out;
            tried++;

            if (preferNeuralIfNotBlank && nLen > 0) break; // early exit
        }
        log.debug("Neural variants tried={}, bestLen={}, totalMs={}", tried, best.strip().length(), (System.nanoTime() - t0) / 1_000_000);
        return best;
    }

    private void dumpDebug(BufferedImage img, String kind, int pageIdx, String label) {
        try {
            if (debugDir == null || debugDir.isBlank()) return;
            Path dir = Path.of(debugDir);
            Files.createDirectories(dir);
            Path out = dir.resolve(String.format("%s_p%02d_%s.png", kind, pageIdx + 1, label));
            ImageIO.write(img, "png", out.toFile());
        } catch (Exception ignore) {}
    }

    /** Map Tesseract codes to EasyOCR codes for the sidecar. */
    private static String mapLangsForEasyOcr(String tessLangsCsv) {
        return tessLangsCsv
                .replace("eng", "en")
                .replace("spa", "es")
                .replace("fra", "fr")
                .replace("deu", "de")
                .replace("ita", "it");
    }
}
