package com.lexaro.api.tts;

import java.text.BreakIterator;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/** Sentence-aware chunker that keeps chunks under a max length. */
public final class TextChunker {
    private TextChunker() {}

    /** Preferred entrypoint used by the audio service. */
    public static List<String> splitBySentences(String text, int maxChars) {
        try {
            return splitWithBreakIterator(text, maxChars);
        } catch (Exception ignore) {
            return splitSmart(text, maxChars);
        }
    }

    /** Your original logic, kept for compatibility. */
    public static List<String> splitSmart(String text, int maxLen) {
        List<String> out = new ArrayList<>();
        if (text == null) return out;
        String s = text.trim();
        if (s.isEmpty()) return out;

        String[] paras = s.split("(\\r?\\n){2,}"); // blank-line delimited paragraphs
        StringBuilder buf = new StringBuilder();

        for (String p : paras) {
            String[] sentences = p.trim().split("(?<=[.!?])\\s+"); // rough sentence split
            for (String sent : sentences) {
                String sentence = sent.trim();
                if (sentence.isEmpty()) continue;

                if (sentence.length() > maxLen) {
                    hardSplit(sentence, maxLen, out, buf);
                } else if (buf.length() + (buf.length() > 0 ? 1 : 0) + sentence.length() <= maxLen) {
                    if (buf.length() > 0) buf.append(' ');
                    buf.append(sentence);
                } else {
                    out.add(buf.toString());
                    buf.setLength(0);
                    buf.append(sentence);
                }
            }
            // soft paragraph boundary: add a space if room, otherwise flush
            if (buf.length() + 1 > maxLen) {
                out.add(buf.toString());
                buf.setLength(0);
            } else if (buf.length() > 0) {
                buf.append(' ');
            }
        }

        if (buf.length() > 0) out.add(buf.toString());
        return out;
    }

    // ---------- internals ----------

    private static List<String> splitWithBreakIterator(String text, int maxChars) {
        List<String> out = new ArrayList<>();
        if (text == null) return out;
        String s = text.trim();
        if (s.isEmpty()) return out;

        BreakIterator bi = BreakIterator.getSentenceInstance(Locale.US);
        bi.setText(s);

        int start = bi.first();
        int end = bi.next();
        StringBuilder buf = new StringBuilder();

        while (end != BreakIterator.DONE) {
            String sentence = s.substring(start, end).trim();
            if (!sentence.isEmpty()) {
                if (sentence.length() > maxChars) {
                    hardSplit(sentence, maxChars, out, buf);
                } else if (buf.length() + (buf.length() > 0 ? 1 : 0) + sentence.length() <= maxChars) {
                    if (buf.length() > 0) buf.append(' ');
                    buf.append(sentence);
                } else {
                    out.add(buf.toString());
                    buf.setLength(0);
                    buf.append(sentence);
                }
            }
            start = end;
            end = bi.next();
        }

        if (buf.length() > 0) out.add(buf.toString());
        return out;
    }

    private static void hardSplit(String sentence, int maxLen, List<String> out, StringBuilder buf) {
        // Prefer word-based splitting; fall back to raw chunking for giant tokens
        String[] words = sentence.split("\\s+");
        for (String w : words) {
            if (w.length() > maxLen) {
                // raw chunk this very long token
                for (int i = 0; i < w.length(); i += maxLen) {
                    appendOrFlush(out, buf, w.substring(i, Math.min(w.length(), i + maxLen)), maxLen);
                }
            } else {
                appendOrFlush(out, buf, w, maxLen);
            }
        }
    }

    private static void appendOrFlush(List<String> out, StringBuilder buf, String token, int maxLen) {
        if (token == null || token.isBlank()) return;
        if (buf.length() == 0) {
            buf.append(token);
            return;
        }
        int extra = 1 + token.length(); // space + token
        if (buf.length() + extra <= maxLen) {
            buf.append(' ').append(token);
        } else {
            out.add(buf.toString());
            buf.setLength(0);
            buf.append(token);
        }
    }
}
