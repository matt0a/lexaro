package com.lexaro.api.service;

import com.lexaro.api.domain.AudioStatus;
import com.lexaro.api.domain.Document;
import com.lexaro.api.repo.DocumentRepository;
import com.lexaro.api.storage.StorageService;
import com.lexaro.api.tts.TtsService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.lexaro.api.extract.TextExtractor;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DocumentAudioService {

    private final DocumentRepository docs;
    private final StorageService storage;
    @Qualifier("pollyTtsService")
    private final TtsService tts;
    private final PlanService plans;
    private final TextExtractor extractor;

    @Transactional
    public void start(Long userId, Long docId, String voice, String engine, String format) {
        var doc = docs.findByIdAndUserId(docId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));

        if (doc.getObjectKey() == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No stored file for this document");

        // Pull file bytes
        byte[] bytes = storage.getBytes(doc.getObjectKey());

        // Extract text by MIME
        String raw;
        try {
            raw = extractor.extract(doc.getMime(),bytes );
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to extract text: " + e.getMessage());
        }

        // Clean it up
        String text = normalizeWhitespace(raw);
        if (text.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No extractable text in file");
        }

        // Cap characters by plan (unless unlimited)
        int cap = plans.ttsMaxCharsFor(doc.getUser());
        if (text.length() > cap) {
            text = text.substring(0, cap);
        }

        // Synthesize audio
        String outFormat = safeAudioFormat(format);
        byte[] audio;
        try {
            audio = tts.synthesize(text, defaultVoice(voice), defaultEngine(engine), safeAudioFormat(format));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "TTS failed", e);
        }


        // Store audio
        String audioKey = "aud/u/%d/%d/%s.%s".formatted(
                userId, doc.getId(), UUID.randomUUID(), outFormat.toLowerCase(Locale.ROOT));

        String contentType = switch (outFormat.toLowerCase(Locale.ROOT)) {
            case "mp3" -> "audio/mpeg";
            case "ogg_vorbis", "ogg" -> "audio/ogg";
            case "pcm" -> "audio/wave";
            default -> "application/octet-stream";
        };
        storage.put(audioKey, audio, contentType);

        // Update doc audio fields
        doc.setAudioObjectKey(audioKey);
        doc.setAudioFormat(outFormat.toLowerCase(Locale.ROOT));
        doc.setAudioVoice(defaultVoice(voice));
        doc.setAudioStatus(AudioStatus.READY);
        //doc.setAudioGeneratedAt(Instant.now());

        docs.save(doc);
    }

    private static String normalizeWhitespace(String s) {
        // collapse runs of whitespace, trim ends
        return s == null ? "" : s.replaceAll("\\s+", " ").trim();
    }

    private static String defaultVoice(String v) {
        return (v == null || v.isBlank()) ? "Joanna" : v;
    }

    private static String defaultEngine(String e) {
        return (e == null || e.isBlank()) ? "neural" : e.toLowerCase(Locale.ROOT);
    }

    private static String safeAudioFormat(String f) {
        if (f == null || f.isBlank()) return "mp3";
        String x = f.toLowerCase(Locale.ROOT);
        return switch (x) {
            case "mp3", "ogg", "ogg_vorbis", "pcm" -> x;
            default -> "mp3";
        };
    }
}
