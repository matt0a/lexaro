package com.lexaro.api.tts;

import java.util.ArrayList;
import java.util.List;

/**
 * Very simple MP3 joiner:
 * - Strips ID3v2 headers if present on each part.
 * - Concatenates MP3 frames. Works reliably when all chunks come from the same Polly voice/format.
 */
public final class AudioJoiner {
    private AudioJoiner() {}

    public static byte[] joinMp3(List<byte[]> parts) {
        if (parts == null || parts.isEmpty()) return new byte[0];
        List<byte[]> cleaned = new ArrayList<>(parts.size());
        int total = 0;

        for (byte[] p : parts) {
            byte[] c = stripId3v2(p);
            cleaned.add(c);
            total += c.length;
        }

        byte[] all = new byte[total];
        int pos = 0;
        for (byte[] c : cleaned) {
            System.arraycopy(c, 0, all, pos, c.length);
            pos += c.length;
        }
        return all;
    }

    /** Strip ID3v2 header if present (at the start). */
    private static byte[] stripId3v2(byte[] data) {
        if (data == null || data.length < 10) return data;
        // "ID3"
        if (data[0] == 'I' && data[1] == 'D' && data[2] == '3') {
            // size is synchsafe in bytes 6..9
            int size =
                    ((data[6] & 0x7F) << 21) |
                            ((data[7] & 0x7F) << 14) |
                            ((data[8] & 0x7F) << 7)  |
                            (data[9] & 0x7F);
            int headerLen = 10 + size;
            if (headerLen > 0 && headerLen < data.length) {
                byte[] out = new byte[data.length - headerLen];
                System.arraycopy(data, headerLen, out, 0, out.length);
                return out;
            }
        }
        return data;
    }
}
