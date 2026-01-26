package com.lexaro.api.education.service;

import java.time.Instant;

public interface AiUsageService {

    /**
     * Increments request count in the given window.
     * Returns the new request count after increment.
     */
    long incrementRequests(long userId, String plan, String featureKey, Instant windowStart, Instant windowEnd, long delta);

    /**
     * Increments tokens in/out in the given window.
     * Returns new total tokens (tokensIn + tokensOut) after increment.
     */
    long incrementTokens(long userId, String plan, String featureKey, Instant windowStart, Instant windowEnd, long tokensInDelta, long tokensOutDelta);

    /**
     * Reads totals for window (requests, tokensIn, tokensOut). Used for enforcement checks.
     */
    UsageTotals getTotals(long userId, String featureKey, Instant windowStart, Instant windowEnd);

    record UsageTotals(long requests, long tokensIn, long tokensOut) {
        public long totalTokens() { return tokensIn + tokensOut; }
    }
}
