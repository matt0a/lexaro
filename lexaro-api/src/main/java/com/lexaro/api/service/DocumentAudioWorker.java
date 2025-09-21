package com.lexaro.api.service;

import com.lexaro.api.domain.AudioStatus;
import com.lexaro.api.domain.Document;
import com.lexaro.api.repo.DocumentRepository;
import com.lexaro.api.storage.StorageService;
import com.lexaro.api.tts.TextChunker;
import com.lexaro.api.tts.TtsService;
import com.lexaro.api.extract.TextExtractor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentAudioWorker {

    private static final int POLLY_SAFE_CHARS = 3000;

    private final DocumentRepository docs;
    private final StorageService storage;
    private final TtsService tts;
    private final PlanService plans;
    private final TextExtractor extractor;

    @Async("ttsExecutor")
    public void process(Long userId, Long docId, String voice, String engine, String format) {
        log.info("TTS start docId={}, userId={}, voice={}, engine={}, format={}",
                docId, userId, voice, engine, format);                 // helpful


        Document doc = docs.findByIdAndUserId(docId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));
        try {
            byte[] bytes = storage.getBytes(doc.getObjectKey());
            String text = extractor.extract(doc.getMime(), bytes, 0);
            if (text == null) text = "";
            text = text.replaceAll("[\\p{Cntrl}&&[^\r\n\t]]", " ")
                    .replaceAll("\\s+", " ")
                    .trim();
            if (text.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No extractable text in file");
            }

            int cap = plans.ttsMaxCharsFor(doc.getUser());
            if (text.length() > cap) text = text.substring(0, cap);

            List<String> chunks = TextChunker.splitBySentences(text, POLLY_SAFE_CHARS);
            log.debug("TTS chunk count for docId={}: {}", docId, chunks.size());

            String v = (voice == null || voice.isBlank()) ? "Joanna" : voice;
            String e = (engine == null || engine.isBlank()) ? "neural" : engine.toLowerCase(Locale.ROOT);
            String f = (format == null || format.isBlank()) ? "mp3" : format.toLowerCase(Locale.ROOT);

            ByteArrayOutputStream mix = new ByteArrayOutputStream();
            for (String c : chunks) {
                if (c == null || c.isBlank()) continue;
                byte[] part = tts.synthesize(c, v, e, f);
                mix.write(part);
            }
            byte[] merged = mix.toByteArray();

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

            doc.setAudioObjectKey(key);
            doc.setAudioFormat(ext);
            doc.setAudioVoice(v);
            doc.setAudioStatus(AudioStatus.READY);
            docs.save(doc);

            log.info("TTS success docId={}, bytesOut={}, key={}", docId, merged.length, key);

        } catch (Exception ex) {
            // ********** This is the line you were asking about **********
            log.error("TTS failed docId={}, userId={}, reason={}", docId, userId, ex.toString(), ex);

            doc.setAudioStatus(AudioStatus.FAILED);
            doc.setAudioObjectKey(null);
            doc.setAudioFormat(null);
            doc.setAudioVoice(null);
            docs.save(doc);
        }
    }
}
