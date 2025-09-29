package com.lexaro.api.service;

import com.lexaro.api.domain.AudioStatus;
import com.lexaro.api.domain.DocStatus;
import com.lexaro.api.repo.DocumentRepository;
import com.lexaro.api.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class RetentionService {

    private final DocumentRepository docs;
    private final @Qualifier("storageService") StorageService storage;

    @Value("${app.retention.graceDays:7}")
    int graceDays;

    /** If true we remove DB rows after tombstoning; otherwise we keep the tombstone row. */
    @Value("${app.retention.hardDelete:false}")
    boolean hardDelete;

    /**
     * Sweeps expired documents in small batches. Runs at fixed delay configured by
     * {@code app.retention.scanMillis}.
     */
    @Scheduled(fixedDelayString = "${app.retention.scanMillis}")
    @Transactional
    public void purgeExpired() {
        final long t0 = System.currentTimeMillis();
        int scanned = 0;
        int purged = 0;
        int errors = 0;

        final Instant cutoff = Instant.now().minus(graceDays, ChronoUnit.DAYS);

        while (true) {
            var batch = docs.findTop100ByExpiresAtIsNotNullAndExpiresAtBeforeAndDeletedAtIsNull(cutoff);
            if (batch.isEmpty()) break;

            scanned += batch.size();

            for (var d : batch) {
                try {
                    // 1) Delete primary file if present
                    if (d.getObjectKey() != null) {
                        try {
                            storage.delete(d.getObjectKey());
                        } catch (Exception ex) {
                            log.warn("Retention: delete object_key failed docId={} key={} reason={}",
                                    d.getId(), d.getObjectKey(), ex.toString());
                        }
                        d.setObjectKey(null);
                    }

                    // 2) Delete audio file if present
                    if (d.getAudioObjectKey() != null) {
                        try {
                            storage.delete(d.getAudioObjectKey());
                        } catch (Exception ex) {
                            log.warn("Retention: delete audio_object_key failed docId={} key={} reason={}",
                                    d.getId(), d.getAudioObjectKey(), ex.toString());
                        }
                        d.setAudioObjectKey(null);
                    }

                    // 3) Tombstone in DB
                    // We do NOT use AudioStatus.EXPIRED; instead reset audio to NONE and mark doc EXPIRED.
                    d.setAudioStatus(AudioStatus.NONE);
                    d.setStatus(DocStatus.EXPIRED);
                    d.setDeletedAt(Instant.now());

                    if (hardDelete) {
                        // Persist tombstone state first (optional), then delete the row.
                        docs.save(d);
                        docs.delete(d);
                    } else {
                        docs.save(d);
                    }

                    purged++;

                } catch (Exception ex) {
                    errors++;
                    log.error("Retention: purge failed docId={} reason={}", d.getId(), ex.toString(), ex);
                }
            }
        }

        long durMs = System.currentTimeMillis() - t0;
        log.info("Retention sweep complete: scanned={}, purged={}, errors={}, durationMs={}",
                scanned, purged, errors, durMs);
    }
}
