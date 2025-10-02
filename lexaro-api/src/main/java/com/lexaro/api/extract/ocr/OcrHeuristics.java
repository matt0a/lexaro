package com.lexaro.api.extract.ocr;

public final class OcrHeuristics {
    private OcrHeuristics() {}

    /** Very rough check: too short OR too few letters → likely poor OCR. */
    public static boolean looksWeak(String text, int minChars, double minAlphaShare) {
        if (text == null) return true;
        String t = text.strip();
        if (t.length() < minChars) return true;
        long alpha = t.chars().filter(Character::isLetter).count();
        double share = t.isEmpty() ? 0.0 : (double) alpha / (double) t.length();
        return share < minAlphaShare;
    }
}
