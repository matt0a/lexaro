package com.lexaro.api.service;

import com.lexaro.api.domain.AudioStatus;
import com.lexaro.api.domain.DocStatus;
import com.lexaro.api.domain.Plan;
import com.lexaro.api.extract.TextExtractor;
import com.lexaro.api.repo.DocumentRepository;
import com.lexaro.api.storage.StorageService;
import com.lexaro.api.tts.TtsVoiceCatalogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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
    private final TtsVoiceCatalogService voices;

    @Transactional
    public void start(Long userId, Long docId, String voice, String engine, String format) {
        var doc = docs.findByIdAndUserId(docId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));

        if (doc.getStatus() == DocStatus.EXPIRED)
            throw new ResponseStatusException(HttpStatus.GONE, "Document expired—please re-upload.");

        if (doc.getObjectKey() == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No stored file for this document");

        // Idempotency
        if (doc.getAudioStatus() == AudioStatus.PROCESSING || doc.getAudioStatus() == AudioStatus.READY)
            return;

        Plan plan = doc.getPlanAtUpload();
        boolean unlimited = plans.isUnlimited(doc.getUser());

        if (plans.requireVerifiedEmail() && !doc.getUser().isVerified())
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Please verify your email to use TTS.");

        // Concurrency guard
        long active = docs.countByUserIdAndAudioStatus(userId, AudioStatus.PROCESSING);
        int maxPerUser = Math.max(1, plans.concurrentMaxPerUser());
        if (active >= maxPerUser) {
            log.warn("TTS start denied (429): active={} >= maxPerUser={}, userId={}, docId={}", active, maxPerUser, userId, docId);
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many concurrent TTS jobs");
        }

        // Peek text length to pre-check quotas
        int perDocCap = plans.ttsMaxCharsForPlan(plan);
        int plannedChars;
        try {
            byte[] bytes = storage.getBytes(doc.getObjectKey());
            String raw = extractor.extract(doc.getMime(), bytes, 0);
            String text = (raw == null ? "" : raw)
                    .replaceAll("[\\p{Cntrl}&&[^\\r\\n\\t]]", " ")
                    .replaceAll("\\s+", " ")
                    .trim();
            if (text.isBlank())
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No extractable text in file");
            plannedChars = Math.min(text.length(), perDocCap);
        } catch (ResponseStatusException rse) {
            throw rse;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to peek text size: " + e.getMessage());
        }

        if (!unlimited) {
            quota.ensureWithinDailyCap(userId, plan, plannedChars);
            quota.ensureWithinMonthlyCap(userId, plan, plannedChars);
        }

        // -------- Voice + engine validation --------
        String chosenVoice  = (voice  == null || voice.isBlank())  ? plans.defaultTtsVoice()   : voice.trim();
        String requestedEng = (engine == null || engine.isBlank()) ? plans.defaultTtsEngine()  : engine.trim().toLowerCase();

        var vInfo = voices.findByName(chosenVoice)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Unknown voice '" + chosenVoice + "'. Call GET /tts/voices for valid names."));

        // Plan gating for neural
        String planCheckedEngine = plans.sanitizeEngineForPlan(requestedEng, plan);
        if (!planCheckedEngine.equalsIgnoreCase(requestedEng) && "neural".equalsIgnoreCase(requestedEng)) {
            // Requested neural but plan disallowed; we downgraded to standard—only proceed if the voice supports it.
            log.info("Neural not allowed for plan={}, falling back to standard for userId={}, docId={}",
                    plan.name(), userId, docId);
        }

        // Voice capability check — if engine not supported, try graceful fallback to standard
        String finalEngine = planCheckedEngine;
        if (!vInfo.enginesSupported().contains(finalEngine)) {
            if ("neural".equals(finalEngine) && vInfo.enginesSupported().contains("standard")) {
                finalEngine = "standard";
                log.info("Voice '{}' doesn’t support neural; falling back to standard", vInfo.name());
            } else {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Voice '" + vInfo.name() + "' does not support engine '" + finalEngine +
                                "'. Supported: " + String.join(",", vInfo.enginesSupported()));
            }
        }

        // Mark + dispatch
        doc.setAudioStatus(AudioStatus.PROCESSING);
        doc.setAudioObjectKey(null);
        doc.setAudioFormat(null);
        doc.setAudioVoice(vInfo.name());
        docs.save(doc);

        worker.process(userId, docId, vInfo.name(), finalEngine, format, unlimited);
    }
}
