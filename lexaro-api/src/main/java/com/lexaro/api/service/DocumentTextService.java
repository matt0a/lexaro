package com.lexaro.api.service;

import com.lexaro.api.domain.Document;
import com.lexaro.api.domain.DocumentText;
import com.lexaro.api.repo.DocumentRepository;
import com.lexaro.api.repo.DocumentTextRepository;
import com.lexaro.api.extract.TextExtractor;
import com.lexaro.api.storage.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class DocumentTextService {
    private final DocumentRepository docs;
    private final DocumentTextRepository texts;
    private final StorageService storage;
    private final TextExtractor extractor;
    private final PlanService plans;

    @Transactional(readOnly = true)
    public DocumentText getCached(Long userId, Long docId) {
        var doc = mustOwn(userId, docId);
        return texts.findByDocId(doc.getId()).orElse(null);
    }

    @Transactional
    public DocumentText getOrExtract(Long userId, Long docId, int maxPagesHint) {
        var doc = mustOwn(userId, docId);

        var cached = texts.findByDocId(doc.getId()).orElse(null);
        if (cached != null) return cached;

        if (doc.getObjectKey() == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No stored file for this document");

        byte[] bytes = storage.getBytes(doc.getObjectKey());
        String raw;
        try {
            raw = extractor.extract(doc.getMime(), bytes, maxPagesHint > 0 ? maxPagesHint : 0);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to extract text: " + e.getMessage());
        }
        if (raw == null) raw = "";
        String text = raw.replaceAll("[\\p{Cntrl}&&[^\r\n\t]]", " ")
                .replaceAll("\\s+", " ").trim();
        if (text.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No extractable text in file");

        // Apply per-document cap by planAtUpload (no lazy load of User)
        int cap = plans.ttsMaxCharsForPlan(doc.getPlanAtUpload());
        if (text.length() > cap) text = text.substring(0, cap);

        var created = DocumentText.builder()
                .document(doc)               // @MapsId will carry doc.id on INSERT
                .mime(doc.getMime())
                .text(text)
                .charCount(text.length())
                .extractedAt(Instant.now())
                .build();

        return texts.save(created); // not saveAndFlush()
    }


    private Document mustOwn(Long userId, Long docId) {
        return docs.findByIdAndUserIdAndDeletedAtIsNull(docId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));
    }
}
