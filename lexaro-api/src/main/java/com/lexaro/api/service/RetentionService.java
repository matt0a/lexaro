package com.lexaro.api.service;

import com.lexaro.api.domain.AudioStatus;
import com.lexaro.api.domain.DocStatus;
import com.lexaro.api.repo.DocumentRepository;
import com.lexaro.api.storage.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class RetentionService {

    private final DocumentRepository docs;
    private final StorageService storage;

    @Value("${app.retention.graceDays:7}")
    int graceDays;

    @Value("${app.retention.hardDelete:false}")
    boolean hardDelete;

    /**
     * Runs every app.retention.scanMillis. Processes expired docs in batches of 100
     * until no more remain (at run time), to avoid waiting for the next tick.
     */
    @Scheduled(fixedDelayString = "${app.retention.scanMillis}")
    @Transactional
    public void purgeExpired() {
        final Instant cutoff = Instant.now().minus(graceDays, ChronoUnit.DAYS);

        while (true) {
            var batch = docs.findTop100ByExpiresAtIsNotNullAndExpiresAtBeforeAndDeletedAtIsNull(cutoff);
            if (batch.isEmpty()) break;

            var now = Instant.now();

            batch.forEach(d -> {
                // Delete primary file
                if (d.getObjectKey() != null) {
                    try { storage.delete(d.getObjectKey()); } catch (Exception ignored) {}
                }
                // Delete audio file if present
                if (d.getAudioObjectKey() != null) {
                    try { storage.delete(d.getAudioObjectKey()); } catch (Exception ignored) {}
                }

                if (hardDelete) {
                    // Hard delete row (and children via cascades)
                    docs.delete(d);
                    return;
                }

                // Soft delete / expire
                d.setDeletedAt(now);
                d.setStatus(DocStatus.EXPIRED);

                // Clear storage pointers so presign/download can't resurrect
                d.setObjectKey(null);
                d.setAudioObjectKey(null);

                // Reset audio fields for safety/UX
                d.setAudioStatus(AudioStatus.NONE);
                d.setAudioFormat(null);
                d.setAudioVoice(null);
                d.setAudioDurationSec(null);
                d.setAudioError("expired"); // if you added audioError
            });

            // JPA flush happens on transaction boundary; explicitly flush so the
            // next loop fetch sees updated deletedAt/status in the same tick.
            docs.flush();
        }
    }
}
