package com.lexaro.api.service;

import com.lexaro.api.domain.Plan;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneOffset;

@Service
@RequiredArgsConstructor
public class TtsQuotaService {

    private final JdbcTemplate jdbc;
    private final PlanService plans;

    /* ---------- keys ---------- */

    /** e.g. "2025-09" in UTC */
    private String monthKey() {
        return YearMonth.now(ZoneOffset.UTC).toString();
    }

    /** e.g. 2025-09-23 in UTC */
    private LocalDate dayKey() {
        return LocalDate.now(ZoneOffset.UTC);
    }

    /* ---------- current usage ---------- */

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

    /* ---------- guards ---------- */

    /** 402 if (used + planned) > monthly cap. */
    public void ensureWithinMonthlyCap(long userId, Plan plan, long plannedChars) {
        long cap  = plans.monthlyCapForPlan(plan);
        if (cap <= 0 || cap == Long.MAX_VALUE) return; // disabled
        long used = currentMonthly(userId);
        if (used + plannedChars > cap) {
            long remaining = Math.max(0, cap - used);
            throw new ResponseStatusException(
                    HttpStatus.PAYMENT_REQUIRED,
                    "Monthly TTS limit reached. Remaining=" + remaining + " chars, requested=" + plannedChars
            );
        }
    }

    /** 429 if (used + planned) > daily cap. */
    public void ensureWithinDailyCap(long userId, Plan plan, long plannedChars) {
        long cap = plans.dailyCapForPlan(plan);
        if (cap <= 0 || cap == Long.MAX_VALUE) return; // disabled for paid tiers
        long used = currentDaily(userId);
        if (used + plannedChars > cap) {
            long remaining = Math.max(0, cap - used);
            throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Daily TTS limit reached. Remaining=" + remaining + " chars, requested=" + plannedChars
            );
        }
    }

    /* ---------- upserts ---------- */

    /** Atomically add to monthly usage and return new total. */
    public long addMonthlyUsage(long userId, long delta) {
        final String sql = """
            insert into tts_usage (user_id, period_ym, chars_used, updated_at)
            values (?, ?, ?, now())
            on conflict (user_id, period_ym)
            do update set chars_used = tts_usage.chars_used + EXCLUDED.chars_used,
                          updated_at = now()
            returning chars_used
            """;
        return jdbc.queryForObject(sql, Long.class, userId, monthKey(), delta);
    }

    /** Atomically add to daily usage and return new total. */
    public long addDailyUsage(long userId, long delta) {
        final String sql = """
            insert into tts_usage_day (user_id, period_ymd, chars_used, updated_at)
            values (?, ?, ?, now())
            on conflict (user_id, period_ymd)
            do update set chars_used = tts_usage_day.chars_used + EXCLUDED.chars_used,
                          updated_at = now()
            returning chars_used
            """;
        return jdbc.queryForObject(sql, Long.class, userId, dayKey(), delta);
    }
}
