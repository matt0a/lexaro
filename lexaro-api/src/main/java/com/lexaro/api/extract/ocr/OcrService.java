package com.lexaro.api.extract.ocr;

import java.awt.image.BufferedImage;

public interface OcrService {
    /** Returns recognized plain text (may contain newlines). Never returns null; return "" on failure. */
    String ocr(BufferedImage image, String langs);
    /** Short engine name, e.g., "tesseract" or "neural". */
    String name();
}
