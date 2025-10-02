package com.lexaro.api.extract.ocr;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

/**
 * HTTP client for the neural OCR sidecar.
 * Sends PNG bytes and expects JSON: { "text": "...", "stats": {...} }.
 * Adds lang hint as a query param (EasyOCR codes), logs timing + stats.
 */
@Slf4j
public class NeuralOcrService implements OcrService {

    private final RestTemplate http;
    private final String baseUrl;

    public NeuralOcrService(String baseUrl, int timeoutMs) {
        this.baseUrl = trimTrailingSlash(baseUrl);
        var f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(timeoutMs);
        f.setReadTimeout(timeoutMs);
        this.http = new RestTemplate(f);
        log.debug("Neural OCR client init: baseUrl={}, timeoutMs={}", this.baseUrl, timeoutMs);
    }

    @Override
    public String ocr(BufferedImage image, String langs) {
        long t0 = System.nanoTime();
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream(64 * 1024);
            ImageIO.write(image, "png", baos);
            byte[] png = baos.toByteArray();

            String langParam = normalizeLangsForEasyOcr(langs); // e.g., "eng" -> "en"
            String url = baseUrl + "/ocr?lang=" + URLEncoder.encode(langParam, StandardCharsets.UTF_8);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.IMAGE_PNG);
            headers.setAccept(List.of(MediaType.APPLICATION_JSON, MediaType.valueOf("application/*+json")));

            HttpEntity<byte[]> req = new HttpEntity<>(png, headers);

            ResponseEntity<Map> resp = http.exchange(URI.create(url), HttpMethod.POST, req, Map.class);

            long tookMs = (System.nanoTime() - t0) / 1_000_000;
            if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) {
                log.warn("Neural non-2xx: status={}, tookMs={}", resp.getStatusCodeValue(), tookMs);
                return "";
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> body = resp.getBody();
            Object text = body.get("text");
            @SuppressWarnings("unchecked")
            Map<String, Object> stats = (Map<String, Object>) body.get("stats");

            if (stats != null) {
                log.debug("Neural stats: {}", stats);
            } else {
                log.debug("Neural call OK: tookMs={}", tookMs);
            }
            return (text == null) ? "" : String.valueOf(text);
        } catch (Exception ex) {
            log.warn("Neural OCR call failed: {}", ex.toString());
            return "";
        }
    }

    @Override public String name() { return "neural"; }

    // ---- helpers ----

    private static String trimTrailingSlash(String s) {
        if (s == null || s.isBlank()) return "";
        return s.endsWith("/") ? s.substring(0, s.length() - 1) : s;
    }

    /**
     * Map common Tesseract codes (eng, spa, fra, deu, ita, por, rus) to EasyOCR codes (en, es, fr, de, it, pt, ru).
     * If multiple are provided, join them with commas. Defaults to "en".
     */
    private static String normalizeLangsForEasyOcr(String langsCsv) {
        if (langsCsv == null || langsCsv.isBlank()) return "en";
        String[] toks = langsCsv.split("[,;\\s]+");
        StringBuilder out = new StringBuilder();
        for (String t : toks) {
            String m = switch (t.toLowerCase()) {
                case "eng" -> "en";
                case "spa" -> "es";
                case "fra", "fre" -> "fr";
                case "deu", "ger" -> "de";
                case "ita" -> "it";
                case "por" -> "pt";
                case "rus" -> "ru";
                // pass through if already EasyOCR-style or unknown
                default -> t.toLowerCase();
            };
            if (!m.isBlank()) {
                if (out.length() > 0) out.append(',');
                out.append(m);
            }
        }
        return (out.length() == 0) ? "en" : out.toString();
    }
}