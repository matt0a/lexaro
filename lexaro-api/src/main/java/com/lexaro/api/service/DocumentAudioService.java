package com.lexaro.api.service;

import com.lexaro.api.domain.AudioStatus;
import com.lexaro.api.repo.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class DocumentAudioService {

    private final DocumentRepository docs;
    private final DocumentAudioWorker worker; // async worker bean (@Async on its process method)

    /**
     * Marks the document as PROCESSING and dispatches background TTS work.
     * Returns immediately; poll GET /documents/{id}/audio until READY/FAILED.
     */
    @Transactional
    public void start(Long userId, Long docId, String voice, String engine, String format) {
        var doc = docs.findByIdAndUserId(docId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));

        if (doc.getObjectKey() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No stored file for this document");
        }

        // Idempotency / guard rails: don't double-start
        if (doc.getAudioStatus() == AudioStatus.PROCESSING || doc.getAudioStatus() == AudioStatus.READY) {
            return;
        }

        // Mark as processing and clear any previous audio fields
        doc.setAudioStatus(AudioStatus.PROCESSING);
        doc.setAudioObjectKey(null);
        doc.setAudioFormat(null);
        doc.setAudioVoice(null);
        docs.save(doc);

        // Fire-and-forget background job (DocumentAudioWorker has the full pipeline)
        worker.process(userId, docId, voice, engine, format);
    }
}
