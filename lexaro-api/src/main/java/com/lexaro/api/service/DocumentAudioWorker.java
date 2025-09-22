package com.lexaro.api.service;

import com.lexaro.api.domain.AudioStatus;
import com.lexaro.api.domain.Document;
import com.lexaro.api.repo.DocumentRepository;
import com.lexaro.api.storage.StorageService;
import com.lexaro.api.tts.TextChunker;
import com.lexaro.api.tts.TtsService;
import com.lexaro.api.extract.TextExtractor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentAudioWorker {

    private final DocumentRepository docs;
    private final StorageService storage;
    private final TtsService tts;
    private final PlanService plans;
    private final TextExtractor extractor;

    @Async("ttsExecutor")
    public void process(Long userId, Long docId, String voice, String engine, String format) {
        log.info("TTS start docId={}, userId={}, voice={}, engine={}, format={}",
                docId, userId, voice, engine, format);

        Document doc = docs.findByIdAndUserId(docId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));

        try {
            if (doc.getObjectKey() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No stored file for this document");
            }

            // 1) Extract & normalize text
            byte[] bytes = storage.getBytes(doc.getObjectKey());
            String text = extractor.extract(doc.getMime(), bytes, 0);
            if (text == null) text = "";
            text = text.replaceAll("[\\p{Cntrl}&&[^\r\n\t]]", " ")
                    .replaceAll("\\s+", " ")
                    .trim();
            if (text.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No extractable text in file");
            }

            // 2) Enforce per-document TTS cap for the plan at upload
            int perDocCap = plans.ttsMaxCharsForPlan(doc.getPlanAtUpload());
            if (text.length() > perDocCap) {
                text = text.substring(0, perDocCap);
            }

            // 3) Chunk safely for the provider
            int safeChunk = plans.ttsSafeChunkChars();           // e.g., 3000
            List<String> chunks = TextChunker.splitBySentences(text, safeChunk);
            log.debug("TTS chunk count for docId={}: {}", docId, chunks.size());

            // 4) Resolve defaults
            String v = (voice == null || voice.isBlank()) ? "Joanna" : voice;
            String e = (engine == null || engine.isBlank())
                    ? plans.defaultTtsEngine()                   // "standard" by default
                    : engine.toLowerCase(Locale.ROOT);
            String f = (format == null || format.isBlank()) ? "mp3" : format.toLowerCase(Locale.ROOT);

            // 5) Synthesize & concatenate
            ByteArrayOutputStream mix = new ByteArrayOutputStream();
            for (String c : chunks) {
                if (c == null || c.isBlank()) continue;
                byte[] part = tts.synthesize(c, v, e, f);
                mix.write(part);
            }
            byte[] merged = mix.toByteArray();

            // 6) Persist audio blob
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

            // 7) Update document state
            doc.setAudioObjectKey(key);
            doc.setAudioFormat(ext);
            doc.setAudioVoice(v);
            doc.setAudioStatus(AudioStatus.READY);
            doc.setAudioError(null); // clear any previous error
            docs.save(doc);

            log.info("TTS success docId={}, bytesOut={}, key={}", docId, merged.length, key);

        } catch (Exception ex) {
            // Don’t leak giant stack traces into DB; keep a short reason
            String reason = ex.getMessage();
            if (reason == null || reason.isBlank()) reason = ex.toString();
            if (reason != null && reason.length() > 500) {
                reason = reason.substring(0, 500);
            }

            log.error("TTS failed docId={}, userId={}, reason={}", docId, userId, reason, ex);

            doc.setAudioStatus(AudioStatus.FAILED);
            doc.setAudioObjectKey(null);
            doc.setAudioFormat(null);
            doc.setAudioVoice(null);
            doc.setAudioError(reason);
            docs.save(doc);
        }
    }
}
