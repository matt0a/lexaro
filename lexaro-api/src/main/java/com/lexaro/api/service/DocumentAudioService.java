package com.lexaro.api.service;

import com.lexaro.api.domain.AudioStatus;
import com.lexaro.api.domain.DocStatus;
import com.lexaro.api.domain.DocumentPurpose;
import com.lexaro.api.extract.TextExtractor;
import com.lexaro.api.repo.DocumentRepository;
import com.lexaro.api.storage.StorageService;
import com.lexaro.api.tts.TtsVoiceCatalogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentAudioService {

    private final DocumentRepository docs;
    private final DocumentAudioWorker worker;   // async
    private final PlanService plans;
    private final TtsQuotaService quota;
    private final StorageService storage;
    private final TextExtractor extractor;
    private final TtsVoiceCatalogService voices; // Polly catalog only

    @Value("${app.translate.conservativeMultiplier:1.3}")
    private double translateMultiplier;

    private static final Pattern WS = Pattern.compile("\\s+");

    private static String normalizeWhitespace(String s) {
        if (s == null) return "";
        String t = s.replaceAll("[\\p{Cntrl}&&[^\\r\\n\\t]]", " ").trim();
        return WS.matcher(t).replaceAll(" ");
    }

    private static int countChars(String s) {
        String t = normalizeWhitespace(s);
        if (t.isEmpty()) return 0;
        return t.length();
    }

    @Transactional
    public void start(Long userId, Long docId, String voice, String engine, String format, String targetLang) {
        var doc = docs.findByIdAndUserId(docId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));

        if (doc.getStatus() == DocStatus.EXPIRED) {
            throw new ResponseStatusException(HttpStatus.GONE, "Document expired—please re-upload.");
        }
        if (doc.getObjectKey() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No stored file for this document");
        }
        if (doc.getAudioStatus() == AudioStatus.PROCESSING || doc.getAudioStatus() == AudioStatus.READY) {
            return;
        }

        var plan = doc.getPlanAtUpload();
        boolean unlimited = plans.isUnlimited(doc.getUser());

        if (plans.requireVerifiedEmail() && !doc.getUser().isVerified()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Please verify your email to use TTS.");
        }

        long active = docs.countByUserIdAndAudioStatus(userId, AudioStatus.PROCESSING);
        int maxPerUser = Math.max(1, plans.concurrentMaxPerUser());
        if (active >= maxPerUser) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many concurrent TTS jobs");
        }

        // ---------------- Validate / normalize voice + engine ----------------
        String reqVoice  = (voice  == null || voice.isBlank())  ? plans.defaultTtsVoice()  : voice;
        String reqEngine = (engine == null || engine.isBlank()) ? plans.defaultTtsEngine() : engine.toLowerCase();

        // Plan gating for engine (e.g., neural might be disallowed by plan). This applies to any provider.
        String gatedEngine = plans.sanitizeEngineForPlan(reqEngine, plan);

        // IMPORTANT: Only validate against the Polly catalog if the requested voice is actually a Polly voice.
        if (voices.isKnownPollyVoice(reqVoice)) {
            if (!voices.voiceSupportsEngine(reqVoice, gatedEngine)) {
                // If neural unsupported but standard is OK, fallback; otherwise 400.
                if ("neural".equals(gatedEngine) && voices.voiceSupportsEngine(reqVoice, "standard")) {
                    gatedEngine = "standard";
                } else {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Voice '" + reqVoice + "' does not support engine '" + gatedEngine + "'."
                    );
                }
            }
        } else {
            // Not a Polly voice -> allow (Speechify or other provider will validate downstream).
            log.debug("Skipping Polly validation for non-Polly voice '{}'", reqVoice);
        }

        // ---------------- Peek planned chars (pre-translate) ----------------
        int perDocCapChars = plans.ttsMaxCharsForPlan(plan);
        int plannedChars;
        try {
            byte[] bytes = storage.getBytes(doc.getObjectKey());
            String raw = extractor.extract(doc.getMime(), bytes, 0);
            String text = normalizeWhitespace(raw);

            if (text.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No extractable text in file");
            }

            int baseChars = Math.min(countChars(text), perDocCapChars);

            boolean willTranslate = targetLang != null
                    && !targetLang.isBlank()
                    && !"auto".equalsIgnoreCase(targetLang)
                    && !"same".equalsIgnoreCase(targetLang);

            plannedChars = willTranslate
                    ? Math.min((int) Math.ceil(baseChars * translateMultiplier), perDocCapChars)
                    : baseChars;

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to peek text size: " + e.getMessage());
        }

        if (!unlimited) {
            quota.ensureWithinDailyCap(userId, plan, plannedChars);
            quota.ensureWithinMonthlyCap(userId, plan, plannedChars);
        }

        // ---------------- Mark & dispatch ----------------

        // If a user generates audio from an EDUCATION document, make it visible in Saved Audio
        // without removing it from the Education library.
        if (doc.getPurpose() == DocumentPurpose.EDUCATION) {
            doc.setPurpose(DocumentPurpose.BOTH);
        } else if (doc.getPurpose() == null) {
            // keep legacy docs sane: if no purpose, treat audio generation as AUDIO
            doc.setPurpose(DocumentPurpose.AUDIO);
        }

        doc.setAudioStatus(AudioStatus.PROCESSING);
        doc.setAudioObjectKey(null);
        doc.setAudioFormat(null);
        doc.setAudioVoice(null);
        doc.setAudioError(null);
        docs.save(doc);

        String fmt = (format == null || format.isBlank()) ? "mp3" : format.toLowerCase();
        worker.process(userId, docId, reqVoice, gatedEngine, fmt, unlimited, targetLang);
    }
}
