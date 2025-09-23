package com.lexaro.api.service;

import com.lexaro.api.domain.Plan;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.YearMonth;
import java.time.ZoneOffset;

@Service
@RequiredArgsConstructor
public class TtsQuotaService {

    private final JdbcTemplate jdbc;
    private final PlanService plans;

    private String period() {
        // e.g. "2025-09" in UTC
        return YearMonth.now(ZoneOffset.UTC).toString();
    }

    public long currentUsage(long userId) {
        var sql = "select chars_used from tts_usage where user_id=? and period_ym=?";
        Long v = null;
        try { v = jdbc.queryForObject(sql, Long.class, userId, period()); } catch (Exception ignored) {}
        return v == null ? 0L : v;
    }

    /** Throws 402 if (used + planned) > cap. */
    public void ensureWithinMonthlyCap(long userId, Plan plan, long plannedChars) {
        long cap  = plans.monthlyCapForPlan(plan);
        long used = currentUsage(userId);
        if (used + plannedChars > cap) {
            long remaining = Math.max(0, cap - used);
            throw new ResponseStatusException(
                    HttpStatus.PAYMENT_REQUIRED,
                    "Monthly TTS limit reached. Remaining=" + remaining + " chars, requested=" + plannedChars
            );
        }
    }

    /** Atomically add to usage and return new total. Call AFTER successful synthesis. */
    public long addUsage(long userId, long delta) {
        var sql = """
            insert into tts_usage (user_id, period_ym, chars_used, updated_at)
            values (?, ?, ?, now())
            on conflict (user_id, period_ym)
            do update set chars_used = tts_usage.chars_used + EXCLUDED.chars_used,
                          updated_at = now()
            returning chars_used
            """;
        return jdbc.queryForObject(sql, Long.class, userId, period(), delta);
    }
}
