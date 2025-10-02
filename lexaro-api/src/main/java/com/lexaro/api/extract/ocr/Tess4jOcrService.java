package com.lexaro.api.extract.ocr;

import lombok.extern.slf4j.Slf4j;
import net.sourceforge.tess4j.ITessAPI;
import net.sourceforge.tess4j.Tesseract;

import java.awt.image.BufferedImage;

@Slf4j
public class Tess4jOcrService implements OcrService {

    private final Tesseract t;
    private final int userDefinedDpi;

    public Tess4jOcrService(String tessdataDirOrNull, Integer psmOrNull, Integer dpiOrNull) {
        this.t = new Tesseract();
        if (tessdataDirOrNull != null && !tessdataDirOrNull.isBlank()) {
            t.setDatapath(tessdataDirOrNull);
        }
        t.setOcrEngineMode(ITessAPI.TessOcrEngineMode.OEM_DEFAULT);

        int psm = (psmOrNull == null) ? ITessAPI.TessPageSegMode.PSM_SINGLE_BLOCK : psmOrNull;
        try { t.setPageSegMode(psm); } catch (Throwable ignore) {
            t.setTessVariable("tessedit_pageseg_mode", String.valueOf(psm));
        }

        // Keep words intact and load dictionaries if present
        t.setTessVariable("preserve_interword_spaces", "1");
        t.setTessVariable("load_system_dawg", "T");
        t.setTessVariable("load_freq_dawg", "T");

        this.userDefinedDpi = (dpiOrNull == null || dpiOrNull <= 0) ? 300 : dpiOrNull;
        t.setTessVariable("user_defined_dpi", String.valueOf(this.userDefinedDpi));

        log.debug("Tess4j init: datapath={}, psm={}, dpi={}", tessdataDirOrNull, psm, this.userDefinedDpi);
    }

    @Override
    public String ocr(BufferedImage image, String langs) {
        long t0 = System.nanoTime();
        try {
            t.setLanguage((langs == null || langs.isBlank()) ? "eng" : langs);
            String out = t.doOCR(image);
            int len = (out == null ? 0 : out.strip().length());
            log.debug("Tess OCR done: len={}, tookMs={}", len, (System.nanoTime() - t0) / 1_000_000);
            return out == null ? "" : out;
        } catch (Throwable ex) {
            log.warn("Tesseract OCR failed: {}", ex.toString());
            return "";
        }
    }

    /** Allow callers to try different page segmentation modes per call. */
    public String ocrWithPsm(BufferedImage image, String langs, int psm) {
        try {
            try { t.setPageSegMode(psm); } catch (Throwable ignore) {
                t.setTessVariable("tessedit_pageseg_mode", String.valueOf(psm));
            }
        } catch (Throwable ignored) { /* best effort */ }
        return ocr(image, langs);
    }

    @Override public String name() { return "tesseract"; }
}
