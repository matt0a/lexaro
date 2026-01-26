package com.lexaro.api.education.service;

public final class JsonExtractUtil {

    private JsonExtractUtil() {}

    /**
     * Extracts the first JSON object/array from a string (handles markdown fences).
     */
    public static String extractFirstJson(String raw) {
        if (raw == null) return null;

        String s = raw.trim();

        // strip ```json fences
        if (s.startsWith("```")) {
            int firstNl = s.indexOf('\n');
            if (firstNl > 0) s = s.substring(firstNl + 1);
            int endFence = s.lastIndexOf("```");
            if (endFence > 0) s = s.substring(0, endFence).trim();
        }

        int obj = s.indexOf('{');
        int arr = s.indexOf('[');
        int start;
        if (obj == -1) start = arr;
        else if (arr == -1) start = obj;
        else start = Math.min(obj, arr);

        if (start < 0) return null;

        char open = s.charAt(start);
        char close = (open == '{') ? '}' : ']';

        int depth = 0;
        boolean inStr = false;
        boolean esc = false;

        for (int i = start; i < s.length(); i++) {
            char c = s.charAt(i);

            if (esc) { esc = false; continue; }
            if (c == '\\') { if (inStr) esc = true; continue; }
            if (c == '"') { inStr = !inStr; continue; }
            if (inStr) continue;

            if (c == open) depth++;
            if (c == close) depth--;

            if (depth == 0) {
                return s.substring(start, i + 1).trim();
            }
        }

        return null;
    }
}
