package com.lexaro.api.service;

import com.lexaro.api.domain.AudioStatus;
import com.lexaro.api.domain.Document;
import com.lexaro.api.repo.DocumentRepository;
import com.lexaro.api.storage.StorageService;
import com.lexaro.api.tts.TtsService;
import com.lexaro.api.tts.TextChunker;
import com.lexaro.api.extract.TextExtractor;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DocumentAudioService {

    private final DocumentRepository docs;
    private final StorageService storage;
    private final TtsService tts;           // provided by TtsConfig (dev or polly)
    private final PlanService plans;
    private final TextExtractor extractor;

    // Keep chunks comfortably under Polly’s hard limit (~3000 chars)
    private static final int POLLY_SAFE_CHARS = 2900;

    @Transactional
    public void start(Long userId, Long docId, String voice, String engine, String format) {
        Document doc = docs.findByIdAndUserId(docId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));

        if (doc.getObjectKey() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No stored file for this document");
        }

        // Idempotency / guard rails
        if (doc.getAudioStatus() == AudioStatus.PROCESSING) return;
        if (doc.getAudioStatus() == AudioStatus.READY) return;

        doc.setAudioStatus(AudioStatus.PROCESSING);
        doc.setAudioObjectKey(null);
        doc.setAudioFormat(null);
        doc.setAudioVoice(null);
        docs.save(doc);

        try {
            // Load file
            byte[] bytes = storage.getBytes(doc.getObjectKey());

            // Extract text by MIME
            String text = extractor.extract(doc.getMime(), bytes, 0);
            if (text == null) text = "";
            text = text.replaceAll("[\\p{Cntrl}&&[^\r\n\t]]", " ")
                    .replaceAll("\\s+", " ")
                    .trim();
            if (text.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No extractable text in file");
            }

            // Plan cap
            int cap = plans.ttsMaxCharsFor(doc.getUser());
            if (text.length() > cap) {
                text = text.substring(0, cap);
            }

            // Chunk for TTS
            List<String> chunks = TextChunker.splitBySentences(text, POLLY_SAFE_CHARS);

            // TTS settings
            String v = (voice == null || voice.isBlank()) ? "Joanna" : voice;
            String e = (engine == null || engine.isBlank()) ? "neural" : engine.toLowerCase(Locale.ROOT);
            String f = (format == null || format.isBlank()) ? "mp3" : format.toLowerCase(Locale.ROOT);

            // Synthesize & concatenate
            ByteArrayOutputStream mix = new ByteArrayOutputStream();
            for (String c : chunks) {
                if (c == null || c.isBlank()) continue;
                byte[] part = tts.synthesize(c, v, e, f);
                mix.write(part);
            }
            byte[] merged = mix.toByteArray();

            // Store audio
            String ext = switch (f) {
                case "ogg_vorbis" -> "ogg";
                case "pcm"        -> "pcm";
                default           -> "mp3";
            };
            String contentType = switch (ext) {
                case "ogg" -> "audio/ogg";
                case "pcm" -> "audio/wave";
                default    -> "audio/mpeg";
            };
            String key = "aud/u/%d/%d/%s.%s".formatted(userId, doc.getId(), UUID.randomUUID(), ext);
            storage.put(key, merged, contentType);

            // Update document
            doc.setAudioObjectKey(key);
            doc.setAudioFormat(ext);
            doc.setAudioVoice(v);
            doc.setAudioStatus(AudioStatus.READY);
            // if you add a column later: doc.setAudioGeneratedAt(Instant.now());
            docs.save(doc);

        } catch (Exception ex) {
            doc.setAudioStatus(AudioStatus.FAILED);
            doc.setAudioObjectKey(null);
            doc.setAudioFormat(null);
            doc.setAudioVoice(null);
            docs.save(doc);
            throw (ex instanceof ResponseStatusException)
                    ? (ResponseStatusException) ex
                    : new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Audio generation failed: " + ex.getMessage(), ex);
        }
    }
}
