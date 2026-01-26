package com.lexaro.api.education.service;

import java.util.concurrent.Callable;

public interface EducationGatekeeper {

    /**
     * Enforce:
     * - education AI enabled
     * - plan allowed
     * - per-minute rate limit
     * - concurrency limit
     * - daily request cap (ai_usage)
     *
     * Then run the AI call, and finally record tokens in monthly window (ai_usage).
     */
    <T> T guardAiCall(String featureKey, long tokensIn, long tokensOut, Callable<T> action);
}
