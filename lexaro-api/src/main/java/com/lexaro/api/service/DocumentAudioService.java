package com.lexaro.api.service;

import com.lexaro.api.domain.AudioStatus;
import com.lexaro.api.domain.DocStatus;
import com.lexaro.api.extract.TextExtractor;
import com.lexaro.api.repo.DocumentRepository;
import com.lexaro.api.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentAudioService {

    private final DocumentRepository docs;
    private final DocumentAudioWorker worker;   // async
    private final PlanService plans;
    private final TtsQuotaService quota;
    private final StorageService storage;
    private final TextExtractor extractor;

    @Transactional
    public void start(Long userId, Long docId, String voice, String engine, String format) {
        var doc = docs.findByIdAndUserId(docId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));

        if (doc.getStatus() == DocStatus.EXPIRED) {
            throw new ResponseStatusException(HttpStatus.GONE, "Document expired—please re-upload.");
        }

        if (doc.getObjectKey() == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No stored file for this document");

        if (doc.getAudioStatus() == AudioStatus.PROCESSING || doc.getAudioStatus() == AudioStatus.READY)
            return;

        var plan = doc.getPlanAtUpload();
        boolean unlimited = plans.isUnlimited(doc.getUser());

        if (plans.requireVerifiedEmail() && !doc.getUser().isVerified())
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Please verify your email to use TTS.");

        // concurrency guard (same as you have)
        long active = docs.countByUserIdAndAudioStatus(userId, AudioStatus.PROCESSING);
        int maxPerUser = Math.max(1, plans.concurrentMaxPerUser());
        if (active >= maxPerUser) {
            log.warn("TTS start denied (429): active={} >= maxPerUser={}, userId={}, docId={}", active, maxPerUser, userId, docId);
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many concurrent TTS jobs");
        }

        // --- NEW: measure actual chars (trim to per-doc cap) ---
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
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to peek text size: " + e.getMessage());
        }

        if (!unlimited) {
            quota.ensureWithinDailyCap(userId, plan, plannedChars);    // 429 if would bust daily
            quota.ensureWithinMonthlyCap(userId, plan, plannedChars);  // 402 if would bust monthly
        }

        // sanitize engine
        String sanitizedEngine = plans.sanitizeEngineForPlan(engine, plan);

        // mark and dispatch
        doc.setAudioStatus(AudioStatus.PROCESSING);
        doc.setAudioObjectKey(null);
        doc.setAudioFormat(null);
        doc.setAudioVoice(null);
        docs.save(doc);

        worker.process(userId, docId, voice, sanitizedEngine, format, unlimited);
    }
}
