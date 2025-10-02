package com.lexaro.api.extract.ocr;

import java.awt.*;
import java.awt.image.BufferedImage;
import java.awt.image.WritableRaster;

public final class ImagePreprocess {
    private ImagePreprocess(){}

    /** Grayscale copy. */
    public static BufferedImage toGray(BufferedImage src) {
        if (src.getType() == BufferedImage.TYPE_BYTE_GRAY) return src;
        BufferedImage out = new BufferedImage(src.getWidth(), src.getHeight(), BufferedImage.TYPE_BYTE_GRAY);
        Graphics2D g = out.createGraphics();
        g.drawImage(src, 0, 0, null);
        g.dispose();
        return out;
    }

    /** Otsu global threshold; returns TYPE_BYTE_GRAY with 0/255 values (safe for Tess). */
    public static BufferedImage otsuBinarize(BufferedImage gray) {
        BufferedImage g = toGray(gray);
        WritableRaster r = g.getRaster();
        int w = g.getWidth(), h = g.getHeight();

        // histogram
        int[] hist = new int[256];
        int[] px = new int[1];
        for (int y = 0; y < h; y++) {
            for (int x = 0; x < w; x++) {
                r.getPixel(x, y, px);
                hist[px[0]]++;
            }
        }

        int total = w * h;
        double sum = 0;
        for (int i = 0; i < 256; i++) sum += i * hist[i];

        double sumB = 0; int wB = 0; int wF; double maxVar = -1; int threshold = 128;
        for (int t = 0; t < 256; t++) {
            wB += hist[t];
            if (wB == 0) continue;
            wF = total - wB;
            if (wF == 0) break;
            sumB += (double) t * hist[t];
            double mB = sumB / wB;
            double mF = (sum - sumB) / wF;
            double between = (double) wB * wF * (mB - mF) * (mB - mF);
            if (between > maxVar) { maxVar = between; threshold = t; }
        }

        // apply threshold (favor black text on white page)
        int lo = 0, hi = 255;
        for (int y = 0; y < h; y++) {
            for (int x = 0; x < w; x++) {
                r.getPixel(x, y, px);
                px[0] = (px[0] > threshold) ? hi : lo;
                r.setPixel(x, y, px);
            }
        }
        return g;
    }

    /** Rotate 90° steps for orientation fallback. */
    public static BufferedImage rotate90(BufferedImage src) {
        BufferedImage out = new BufferedImage(src.getHeight(), src.getWidth(), src.getType());
        Graphics2D g = out.createGraphics();
        g.translate((double) out.getWidth() / 2, (double) out.getHeight() / 2);
        g.rotate(Math.toRadians(90));
        g.translate(-(double) src.getWidth() / 2, -(double) src.getHeight() / 2);
        g.drawImage(src, 0, 0, null);
        g.dispose();
        return out;
    }
}
