package com.lexaro.api.service;

import com.lexaro.api.domain.AudioStatus;
import com.lexaro.api.domain.DocStatus;
import com.lexaro.api.repo.DocumentRepository;
import com.lexaro.api.storage.StorageService;
import com.lexaro.api.tts.TtsService;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.UUID;

@Service
public class DocumentAudioService {
    private final DocumentRepository docs;
    private final StorageService storage;
    private final TtsService tts;

    public DocumentAudioService(
            DocumentRepository docs,
            StorageService storage,
            TtsService tts) {
        this.docs = docs;
        this.storage = storage;
        this.tts = tts;
    }

    @Transactional
    public void start(Long userId, Long docId, String voice, String engine, String format) {
        var doc = docs.findByIdAndUserId(docId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));
        if (doc.getStatus() != DocStatus.READY || doc.getObjectKey() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Document file not ready");
        }
        if (doc.getAudioStatus() == AudioStatus.PROCESSING) return; // idempotent
        doc.setAudioStatus(AudioStatus.PROCESSING);
        doc.setAudioVoice(voice);
        doc.setAudioFormat(format);
        docs.save(doc);

        // kick async job
        synthesizeAsync(doc.getId(), voice, engine, format);
    }

    @Async
    public void synthesizeAsync(Long docId, String voice, String engine, String format) {
        var doc = docs.findById(docId).orElse(null);
        if (doc == null) return;

        try {
            // 1) fetch the PDF bytes from storage
            byte[] pdf = storage.getBytes(doc.getObjectKey());

            // 2) extract text (MVP: whole doc; can paginate later)
            String text = extractText(pdf);
            if (text == null || text.isBlank()) {
                throw new IllegalStateException("No extractable text");
            }

            // Optional safety limit (Polly short-form ~3k chars per call)
            int limit = Math.min(text.length(), 2800);
            String slice = text.substring(0, limit);

            // 3) synthesize
            byte[] audio = tts.synthesize(slice, voice, engine, format);

            // 4) write to storage
            String audioKey = "aud/u/%d/%d/%s.%s".formatted(doc.getUser().getId(), doc.getId(),
                    UUID.randomUUID(), format);
            storage.put(audioKey, audio, "audio/" + format);

            // 5) update doc
            doc.setAudioObjectKey(audioKey);
            doc.setAudioStatus(AudioStatus.READY);
            doc.setAudioDurationSec(null); // (optional: compute later)
            docs.save(doc);
        } catch (Exception ex) {
            doc.setAudioStatus(AudioStatus.FAILED);
            docs.save(doc);
        }
    }

    private static String extractText(byte[] pdf) throws IOException {
        try (var in = new ByteArrayInputStream(pdf);
             var pd = PDDocument.load(in)) {
            var stripper = new PDFTextStripper();
            return stripper.getText(pd).replaceAll("\\s+", " ").trim();
        }
    }
}
