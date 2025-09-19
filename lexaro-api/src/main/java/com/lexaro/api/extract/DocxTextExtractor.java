package com.lexaro.api.extract;

import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;

import java.io.ByteArrayInputStream;

public class DocxTextExtractor implements ContentExtractor {
    @Override
    public String extract(byte[] bytes, int maxPages) throws Exception {
        try (var in = new ByteArrayInputStream(bytes);
             var doc = new XWPFDocument(in);
             var extractor = new XWPFWordExtractor(doc)) {

            String text = extractor.getText();
            return text == null ? "" : text.trim();
        }
    }
}