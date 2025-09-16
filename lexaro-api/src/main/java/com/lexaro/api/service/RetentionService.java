package com.lexaro.api.service;

import com.lexaro.api.repo.DocumentRepository;
import com.lexaro.api.storage.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
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
    private final @Qualifier("storageService") StorageService storage;

    @Value("${app.retention.graceDays:7}")
    int graceDays;

    // Every 10 minutes by default (override with app.retention.scanMillis)
    @Scheduled(fixedDelayString = "${app.retention.scanMillis}")
    @Transactional
    public void purgeExpired() {
        var cutoff = Instant.now().minus(graceDays, ChronoUnit.DAYS);
        var batch = docs.findTop100ByExpiresAtIsNotNullAndExpiresAtBeforeAndDeletedAtIsNull(cutoff);
        var now = Instant.now();

        for (var d : batch) {
            if (d.getObjectKey() != null) {
                try { storage.delete(d.getObjectKey()); } catch (Exception ignored) {}
            }
            d.setDeletedAt(now);
            d.setStatus(com.lexaro.api.domain.DocStatus.EXPIRED);
        }
    }

}
