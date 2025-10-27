package com.lexaro.api.tts;

import java.text.BreakIterator;
import java.util.Locale;

public final class TextUnits {
    private TextUnits() {}

    /** Count "words" using locale-aware BreakIterator. */
    public static int countWords(String text) {
        if (text == null || text.isBlank()) return 0;
        // Normalize whitespace
        String norm = text.replaceAll("[\\p{Z}\\s]+", " ").trim();
        if (norm.isEmpty()) return 0;

        BreakIterator it = BreakIterator.getWordInstance(Locale.ROOT);
        it.setText(norm);
        int words = 0;
        int start = it.first();
        for (int end = it.next(); end != BreakIterator.DONE; start = end, end = it.next()) {
            String token = norm.substring(start, end);
            // "Word" tokens contain at least one letter/number mark
            if (token.chars().anyMatch(ch -> Character.isLetterOrDigit(ch))) {
                words++;
            }
        }
        return words;
    }
}