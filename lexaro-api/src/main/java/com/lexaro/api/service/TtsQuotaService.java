package com.lexaro.api.service;

import com.lexaro.api.domain.Plan;
import com.lexaro.api.repo.TtsTopupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TtsQuotaService {

    private final JdbcTemplate jdbc;
    private final PlanService plans;

    /** Optional: present only if you wired the top-ups repo. */
    private final Optional<TtsTopupRepository> topups;

    /* ---------- keys ---------- */

    /** e.g. "2025-10" in UTC */
    private String monthKey() {
        return YearMonth.now(ZoneOffset.UTC).toString();
    }

    /** e.g. 2025-10-03 in UTC */
    private LocalDate dayKey() {
        return LocalDate.now(ZoneOffset.UTC);
    }

    /* ---------- current usage (store words in columns named chars_used) ---------- */
    // NOTE: We are interpreting chars_used as WORDS now to avoid a migration.

    public long currentMonthly(long userId) {
        final String sql = "select chars_used from tts_usage where user_id=? and period_ym=?";
        Long v = null;
        try { v = jdbc.queryForObject(sql, Long.class, userId, monthKey()); } catch (Exception ignored) {}
        return v == null ? 0L : v;
    }

    public long currentDaily(long userId) {
        final String sql = "select chars_used from tts_usage_day where user_id=? and period_ymd=?";
        Long v = null;
        try { v = jdbc.queryForObject(sql, Long.class, userId, dayKey()); } catch (Exception ignored) {}
        return v == null ? 0L : v;
    }

    /* ---------- top-ups ---------- */

    /** Sum of top-ups for current month (0 if repo not present). */
    public long monthTopups(long userId) {
        return topups.map(r -> r.sumForPeriod(userId, monthKey())).orElse(0L);
    }

    /* ---------- convenience ---------- */

    /**
     * Remaining monthly words = base plan cap (words) + top-ups (words) - alreadyUsed (words).
     * Returns Long.MAX_VALUE for unlimited plans.
     */
    public long monthlyRemaining(long userId, Plan plan, long alreadyUsed) {
        long baseCapWords = plans.monthlyCapForPlan(plan); // interpret as words
        if (baseCapWords == Long.MAX_VALUE) return Long.MAX_VALUE;
        long extraWords = monthTopups(userId);
        long remaining = baseCapWords + extraWords - alreadyUsed;
        return Math.max(0L, remaining);
    }

    /* ---------- guards ---------- */

    /** 402 if (used + planned) > (base cap + top-ups). Units = words. */
    public void ensureWithinMonthlyCap(long userId, Plan plan, long plannedWords) {
        long base = plans.monthlyCapForPlan(plan); // words
        if (base == Long.MAX_VALUE) return; // unlimited
        long extra = monthTopups(userId);   // words
        long used  = currentMonthly(userId);// words

        if (used + plannedWords > base + extra) {
            long remaining = Math.max(0L, base + extra - used);
            throw new ResponseStatusException(
                    HttpStatus.PAYMENT_REQUIRED,
                    "Monthly TTS limit reached. Remaining=" + remaining + " words, requested=" + plannedWords
            );
        }
    }

    /** 429 if (used + planned) > daily cap. (Top-ups do NOT affect daily caps.) Units = words. */
    public void ensureWithinDailyCap(long userId, Plan plan, long plannedWords) {
        long cap = plans.dailyCapForPlan(plan); // words; 0 or MAX_VALUE means unlimited
        if (cap <= 0 || cap == Long.MAX_VALUE) return;
        long used = currentDaily(userId);
        if (used + plannedWords > cap) {
            long remaining = Math.max(0, cap - used);
            throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Daily TTS limit reached. Remaining=" + remaining + " words, requested=" + plannedWords
            );
        }
    }

    /* ---------- upserts (atomic per row). Units = words. ---------- */

    public long addMonthlyUsage(long userId, long deltaWords) {
        deltaWords = clampNonNegative(deltaWords);
        if (deltaWords == 0) return currentMonthly(userId);
        final String sql = """
            insert into tts_usage (user_id, period_ym, chars_used, updated_at)
            values (?, ?, ?, now())
            on conflict (user_id, period_ym)
            do update set chars_used = tts_usage.chars_used + EXCLUDED.chars_used,
                          updated_at = now()
            returning chars_used
            """;
        return jdbc.queryForObject(sql, Long.class, userId, monthKey(), deltaWords);
    }

    public long addDailyUsage(long userId, long deltaWords) {
        deltaWords = clampNonNegative(deltaWords);
        if (deltaWords == 0) return currentDaily(userId);
        final String sql = """
            insert into tts_usage_day (user_id, period_ymd, chars_used, updated_at)
            values (?, ?, ?, now())
            on conflict (user_id, period_ymd)
            do update set chars_used = tts_usage_day.chars_used + EXCLUDED.chars_used,
                          updated_at = now()
            returning chars_used
            """;
        return jdbc.queryForObject(sql, Long.class, userId, dayKey(), deltaWords);
    }

    /* ---------- friendly wrappers ---------- */

    public long addUsage(long userId, long deltaWords) { return addMonthlyUsage(userId, deltaWords); }
    public long addDaily(long userId, long deltaWords) { return addDailyUsage(userId, deltaWords); }

    @Transactional
    public void recordUsage(long userId, long deltaWords) {
        deltaWords = clampNonNegative(deltaWords);
        if (deltaWords == 0) return;
        addMonthlyUsage(userId, deltaWords);
        addDailyUsage(userId, deltaWords);
    }

    /* ---------- utils ---------- */

    private static long clampNonNegative(long v) { return v < 0 ? 0 : v; }
}
