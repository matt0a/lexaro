package com.lexaro.api.service;

import com.lexaro.api.domain.AudioStatus;
import com.lexaro.api.repo.DocumentRepository;
import com.lexaro.api.storage.StorageService;
import com.lexaro.api.translate.TranslateService;
import com.lexaro.api.tts.TextChunker;
import com.lexaro.api.tts.TtsService;
import com.lexaro.api.extract.TextExtractor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
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
    private final TtsQuotaService quota;
    private final @Autowired(required = false) TranslateService translate;

    @Async("ttsExecutor")
    public void process(Long userId, Long docId, String voice, String engine, String format, boolean unlimited, String targetLang) {
        log.info("TTS start docId={}, userId={}, voice={}, engine={}, format={}, targetLang={}",
                docId, userId, voice, engine, format, targetLang);

        var doc = docs.findByIdAndUserId(docId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));

        try {
            byte[] bytes = storage.getBytes(doc.getObjectKey());

            String text = extractor.extract(doc.getMime(), bytes, 0);
            if (text == null) text = "";
            text = text.replaceAll("[\\p{Cntrl}&&[^\\r\\n\\t]]", " ")
                    .replaceAll("\\s+", " ")
                    .trim();
            if (text.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No extractable text in file");
            }

            // Per-doc cap BEFORE translation to bound costs
            int perDocCap = plans.ttsMaxCharsForPlan(doc.getPlanAtUpload());
            if (text.length() > perDocCap) text = text.substring(0, perDocCap);

            // Optional translation
            boolean doTranslate = translate != null
                    && targetLang != null
                    && !targetLang.isBlank()
                    && !"auto".equalsIgnoreCase(targetLang)
                    && !"same".equalsIgnoreCase(targetLang);

            if (doTranslate) {
                text = translate.translate(text, "auto", targetLang);
                if (text.length() > perDocCap) text = text.substring(0, perDocCap);
            }

            int safeChunk = plans.ttsSafeChunkChars();
            List<String> chunks = TextChunker.splitBySentences(text, safeChunk);
            log.debug("TTS chunks docId={}, count={}", docId, chunks.size());

            String v = (voice == null || voice.isBlank()) ? plans.defaultTtsVoice()   : voice;
            String e = (engine == null || engine.isBlank()) ? plans.defaultTtsEngine() : engine.toLowerCase(Locale.ROOT);
            String f = (format == null || format.isBlank()) ? "mp3" : format.toLowerCase(Locale.ROOT);

            ByteArrayOutputStream mix = new ByteArrayOutputStream();
            for (String c : chunks) {
                if (c == null || c.isBlank()) continue;
                mix.write(tts.synthesize(c, v, e, f));
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

            if (!unlimited) {
                // Record REAL synthesized chars (post-translation)
                quota.addMonthlyUsage(userId, text.length());
                quota.addDailyUsage(userId, text.length());
            }

            doc.setAudioObjectKey(key);
            doc.setAudioFormat(ext);
            doc.setAudioVoice(v);
            doc.setAudioStatus(AudioStatus.READY);
            docs.save(doc);

            log.info("TTS success docId={}, bytesOut={}, key={}", docId, merged.length, key);

        } catch (Exception ex) {
            log.error("TTS failed docId={}, userId={}, reason={}", docId, userId, ex.toString(), ex);
            doc.setAudioStatus(AudioStatus.FAILED);
            doc.setAudioObjectKey(null);
            doc.setAudioFormat(null);
            doc.setAudioVoice(null);
            // If you added a 'audioError' field on Document, set a trimmed message here.
            // doc.setAudioError(ex.getMessage() == null ? "TTS failed" : ex.getMessage().substring(0, Math.min(250, ex.getMessage().length())));
            docs.save(doc);
        }
    }
}
