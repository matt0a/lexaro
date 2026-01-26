package com.lexaro.api.education.service.impl;

import com.lexaro.api.education.service.AiUsageService;
import com.lexaro.api.education.domain.AiUsage;
import com.lexaro.api.education.repo.AiUsageRepository;
import jakarta.persistence.OptimisticLockException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AiUsageServiceImpl implements AiUsageService {

    private final AiUsageRepository aiUsageRepository;

    @Override
    @Transactional
    public long incrementRequests(long userId, String plan, String featureKey, Instant windowStart, Instant windowEnd, long delta) {
        AiUsage u = upsertRow(userId, plan, featureKey, windowStart, windowEnd);
        u.setRequestsCount(u.getRequestsCount() + delta);
        AiUsage saved = saveWithRetry(u);
        return saved.getRequestsCount();
    }

    @Override
    @Transactional
    public long incrementTokens(long userId, String plan, String featureKey, Instant windowStart, Instant windowEnd, long tokensInDelta, long tokensOutDelta) {
        AiUsage u = upsertRow(userId, plan, featureKey, windowStart, windowEnd);
        u.setTokensIn(u.getTokensIn() + tokensInDelta);
        u.setTokensOut(u.getTokensOut() + tokensOutDelta);
        AiUsage saved = saveWithRetry(u);
        return saved.getTokensIn() + saved.getTokensOut();
    }

    @Override
    @Transactional(readOnly = true)
    public UsageTotals getTotals(long userId, String featureKey, Instant windowStart, Instant windowEnd) {
        return aiUsageRepository
                .findByUserIdAndFeatureKeyAndWindowStartAndWindowEnd(userId, featureKey, windowStart, windowEnd)
                .map(u -> new UsageTotals(u.getRequestsCount(), u.getTokensIn(), u.getTokensOut()))
                .orElseGet(() -> new UsageTotals(0, 0, 0));
    }

    private AiUsage upsertRow(long userId, String plan, String featureKey, Instant windowStart, Instant windowEnd) {
        return aiUsageRepository
                .findByUserIdAndFeatureKeyAndWindowStartAndWindowEnd(userId, featureKey, windowStart, windowEnd)
                .orElseGet(() -> {
                    AiUsage created = new AiUsage();
                    created.setUserId(userId);
                    created.setPlan(plan);
                    created.setFeatureKey(featureKey);
                    created.setRequestsCount(0L);
                    created.setTokensIn(0L);
                    created.setTokensOut(0L);
                    created.setWindowStart(windowStart);
                    created.setWindowEnd(windowEnd);
                    return aiUsageRepository.save(created);
                });
    }

    private AiUsage saveWithRetry(AiUsage u) {
        int tries = 0;
        while (true) {
            try {
                return aiUsageRepository.save(u);
            } catch (OptimisticLockingFailureException | OptimisticLockException ex) {
                if (++tries >= 3) throw ex;
                // reload and retry
                u = aiUsageRepository.findById(u.getId()).orElseThrow();
            }
        }
    }
}
