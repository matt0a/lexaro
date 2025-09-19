package com.lexaro.api.extract;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;

public class PdfTextExtractor implements ContentExtractor {
    @Override
    public String extract(byte[] bytes, int maxPages) throws Exception {
        try (PDDocument doc = Loader.loadPDF(bytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            if (maxPages > 0) {
                stripper.setStartPage(1);
                stripper.setEndPage(Math.min(maxPages, doc.getNumberOfPages()));
            }
            String text = stripper.getText(doc);
            return text == null ? "" : text.trim();
        }
    }
}
