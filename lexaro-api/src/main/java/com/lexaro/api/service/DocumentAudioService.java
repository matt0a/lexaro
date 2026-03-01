package com.lexaro.api.service;

import com.lexaro.api.domain.AudioStatus;
import com.lexaro.api.domain.DocStatus;
import com.lexaro.api.domain.DocumentPurpose;
import com.lexaro.api.domain.JobPayload;
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
    private final JobService jobService;

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
        // Atomically transition audio_status NONE/FAILED → PROCESSING.
        // Returns 0 if another request already claimed the slot (PROCESSING) or audio is READY,
        // preventing duplicate job dispatch under concurrent requests.
        // This replaces the previous non-atomic read-then-check which was susceptible to a
        // TOCTOU race where two concurrent callers both observed NONE and both dispatched a job.
        if (docs.claimAudioProcessing(docId) == 0) {
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

        // The atomic claimAudioProcessing UPDATE already set audio_status = PROCESSING in the DB,
        // but the in-memory 'doc' entity still holds the old value (NONE or FAILED) from the
        // initial findByIdAndUserId call. We must sync the entity's audioStatus field to PROCESSING
        // before saving so that Hibernate's dirty-check does not overwrite the DB value with NONE.
        // We also clear any stale audio output fields from a previous run so the worker starts clean.
        doc.setAudioStatus(AudioStatus.PROCESSING);
        doc.setAudioObjectKey(null);
        doc.setAudioFormat(null);
        doc.setAudioVoice(null);
        doc.setAudioError(null);
        docs.save(doc);

        // Enqueue a durable job instead of dispatching directly to the @Async worker.
        // The JobRunner polls the job table and dispatches to DocumentAudioWorker,
        // providing restart-safety: if the API dies mid-job, the runner picks it up
        // again on restart. The payload stores voice/engine/format so the runner
        // can reconstruct the call without an extra document lookup.
        String fmt = (format == null || format.isBlank()) ? "mp3" : format.toLowerCase();
        jobService.enqueue(userId, docId, "TTS",
                new JobPayload(reqVoice, gatedEngine, fmt, unlimited, targetLang));
    }
}
