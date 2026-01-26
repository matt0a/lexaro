package com.lexaro.api.education.service.impl;

import com.lexaro.api.domain.Plan;
import com.lexaro.api.domain.User;
import com.lexaro.api.education.config.EducationProperties;
import com.lexaro.api.education.service.AiUsageService;
import com.lexaro.api.education.service.EducationGatekeeper;
import com.lexaro.api.education.service.EducationUserContextService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;

import static org.springframework.http.HttpStatus.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class EducationGatekeeperImpl implements EducationGatekeeper {

    private static final String TOTAL_KEY = "education_ai_total";

    // In-memory controls (MVP). If you scale horizontally later, move to Redis.
    private final ConcurrentHashMap<Long, Semaphore> userSemaphores = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Long, TokenBucket> perMinuteBuckets = new ConcurrentHashMap<>();

    private final EducationProperties educationProperties;
    private final EducationUserContextService userContext;
    private final AiUsageService aiUsageService;

    @Override
    public <T> T guardAiCall(String featureKey, long tokensIn, long tokensOut, Callable<T> action) {
        User u = userContext.requireCurrentUser();

        if (!educationProperties.getFeatures().isAiEnabled()) {
            throw new ResponseStatusException(SERVICE_UNAVAILABLE, "Education AI is disabled");
        }

        String plan = normalizePlan(u.getPlan());
        if (!isPlanAllowed(plan)) {
            throw new ResponseStatusException(FORBIDDEN, "Your plan is not allowed to use Education AI");
        }

        // per-minute rate limit
        TokenBucket bucket = perMinuteBuckets.computeIfAbsent(u.getId(), id -> new TokenBucket(ratePerMinute(plan)));
        if (!bucket.tryTake()) {
            throw new ResponseStatusException(TOO_MANY_REQUESTS, "Rate limit exceeded. Try again in a moment.");
        }

        // concurrency limit
        Semaphore sem = userSemaphores.computeIfAbsent(u.getId(), id -> new Semaphore(maxConcurrent(plan)));
        boolean acquired = sem.tryAcquire();
        if (!acquired) {
            throw new ResponseStatusException(TOO_MANY_REQUESTS, "Too many concurrent Education AI requests. Try again.");
        }

        try {
            // daily request cap (strict)
            EducationProperties.Limits.PlanLimit lim = limitFor(plan);
            if (lim.getDailyRequests() > 0) {
                Instant now = Instant.now();
                Instant d0 = startOfDayUtc(now);
                Instant d1 = d0.plus(1, ChronoUnit.DAYS);

                AiUsageService.UsageTotals totals = aiUsageService.getTotals(u.getId(), TOTAL_KEY, d0, d1);
                if (totals.requests() >= lim.getDailyRequests()) {
                    throw new ResponseStatusException(TOO_MANY_REQUESTS, "Daily Education AI limit reached");
                }
                aiUsageService.incrementRequests(u.getId(), plan, TOTAL_KEY, d0, d1, 1);
            }

            // run the work
            T result = action.call();

            // monthly token fuse (enforced for next call; accurate accounting)
            if (lim.getMonthlyTokens() > 0 && (tokensIn > 0 || tokensOut > 0)) {
                Instant now = Instant.now();
                Instant m0 = startOfMonthUtc(now);
                Instant m1 = m0.plus(1, ChronoUnit.DAYS)
                        .atZone(ZoneOffset.UTC)
                        .withDayOfMonth(1)
                        .plusMonths(1)
                        .toInstant();

                AiUsageService.UsageTotals totals = aiUsageService.getTotals(u.getId(), TOTAL_KEY, m0, m1);
                long after = totals.totalTokens() + tokensIn + tokensOut;

                aiUsageService.incrementTokens(u.getId(), plan, TOTAL_KEY, m0, m1, tokensIn, tokensOut);

                if (after > lim.getMonthlyTokens()) {
                    log.warn("User {} exceeded monthly token fuse: {} > {}", u.getId(), after, lim.getMonthlyTokens());
                }
            }

            return result;

        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(INTERNAL_SERVER_ERROR, "Education AI failed", ex);
        } finally {
            sem.release();
        }
    }

    private boolean isPlanAllowed(String plan) {
        Set<String> allowed = Set.copyOf(educationProperties.getFeatures().getAiAllowedPlans());
        return allowed.contains(plan);
    }

    private EducationProperties.Limits.PlanLimit limitFor(String plan) {
        EducationProperties.Limits limits = educationProperties.getLimits();
        if ("FREE".equals(plan)) return limits.getFree();
        if ("PREMIUM".equals(plan)) return limits.getPremium();
        // treat BUSINESS + BUSINESS_PLUS as PREMIUM+ (businessPlus)
        if ("BUSINESS".equals(plan) || "BUSINESS_PLUS".equals(plan)) return limits.getBusinessPlus();
        // fallback
        return limits.getPremium();
    }

    private String normalizePlan(Plan p) {
        if (p == null) return "FREE";
        return p.name().toUpperCase(Locale.ROOT);
    }

    private int ratePerMinute(String plan) {
        // MVP defaults
        return "FREE".equals(plan) ? 8 : 60;
    }

    private int maxConcurrent(String plan) {
        // MVP defaults
        return "FREE".equals(plan) ? 1 : 2;
    }

    private Instant startOfDayUtc(Instant now) {
        return now.atZone(ZoneOffset.UTC).toLocalDate().atStartOfDay(ZoneOffset.UTC).toInstant();
    }

    private Instant startOfMonthUtc(Instant now) {
        LocalDate d = now.atZone(ZoneOffset.UTC).toLocalDate();
        LocalDate first = LocalDate.of(d.getYear(), d.getMonth(), 1);
        return first.atStartOfDay(ZoneOffset.UTC).toInstant();
    }

    /**
     * Simple refill-per-minute token bucket.
     */
    private static final class TokenBucket {
        private final int capacityPerMinute;
        private final AtomicLong windowStartMinute = new AtomicLong(currentMinute());
        private final AtomicLong usedThisMinute = new AtomicLong(0);

        private TokenBucket(int capacityPerMinute) {
            this.capacityPerMinute = capacityPerMinute;
        }

        boolean tryTake() {
            long nowMin = currentMinute();
            long start = windowStartMinute.get();

            if (nowMin != start) {
                if (windowStartMinute.compareAndSet(start, nowMin)) {
                    usedThisMinute.set(0);
                }
            }

            long used = usedThisMinute.incrementAndGet();
            return used <= capacityPerMinute;
        }

        private static long currentMinute() {
            return System.currentTimeMillis() / 60_000L;
        }
    }
}
