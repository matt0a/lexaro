package com.lexaro.api.service;

import com.lexaro.api.domain.Plan;
import com.lexaro.api.domain.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class PlanService {

    // --- Free ---
    @Value("${app.plans.free.retentionDays:0}")   private int freeRetentionDays;
    @Value("${app.plans.free.maxPages:100}")      private int freeMaxPages;
    @Value("${app.plans.free.maxSizeMb:50}")      private int freeMaxMb;

    // --- Premium ---
    @Value("${app.plans.premium.retentionDays:30}") private int premiumRetentionDays;
    @Value("${app.plans.premium.maxPages:1000}")    private int premiumMaxPages;
    @Value("${app.plans.premium.maxSizeMb:300}")    private int premiumMaxMb;

    // TTS character caps
    @Value("${app.tts.maxChars.free:50000}")      private int freeMaxChars;
    @Value("${app.tts.maxChars.premium:1000000}") private int premiumMaxChars;

    // allowlists
    @Value("${app.dev.adminEmails:}")      private String adminEmailsCsv;
    @Value("${app.unlimited-emails:}")     private String unlimitedEmailsCsv;
    @Value("${app.unlimited.user-ids:}")   private String unlimitedUserIdsCsv;

    /* ---------- helpers ---------- */

    private static boolean csvHasIgnoreCase(String csv, String value) {
        if (csv == null || csv.isBlank() || value == null || value.isBlank()) return false;
        for (String s : csv.split(",")) if (value.equalsIgnoreCase(s.trim())) return true;
        return false;
    }
    private static boolean csvHasId(String csv, Long id) {
        if (csv == null || csv.isBlank() || id == null) return false;
        for (String s : csv.split(",")) {
            try { if (id.equals(Long.parseLong(s.trim()))) return true; }
            catch (NumberFormatException ignored) {}
        }
        return false;
    }

    /* ---------- API ---------- */

    public boolean isAdminEmail(String email) {
        return csvHasIgnoreCase(adminEmailsCsv, email);
    }
    public boolean isUnlimited(User user) {
        if (user == null) return false;
        return csvHasIgnoreCase(unlimitedEmailsCsv, user.getEmail())
                || csvHasId(unlimitedUserIdsCsv, user.getId())
                || isAdminEmail(user.getEmail());
    }
    public Plan effectivePlan(User user) {
        return isUnlimited(user) ? Plan.PREMIUM : (user != null ? user.getPlan() : Plan.FREE);
    }

    public int retentionDaysFor(User user) {
        if (isUnlimited(user)) return 36500; // ~100 years
        return effectivePlan(user) == Plan.PREMIUM ? premiumRetentionDays : freeRetentionDays;
    }
    public int maxPagesFor(User user) {
        if (isUnlimited(user)) return Integer.MAX_VALUE;
        return effectivePlan(user) == Plan.PREMIUM ? premiumMaxPages : freeMaxPages;
    }
    public long maxBytesFor(User user) {
        if (isUnlimited(user)) return Long.MAX_VALUE;
        int mb = (effectivePlan(user) == Plan.PREMIUM ? premiumMaxMb : freeMaxMb);
        return (long) mb * 1024L * 1024L;
    }
    public int ttsMaxCharsFor(User user) {
        if (isUnlimited(user)) return Integer.MAX_VALUE;
        return effectivePlan(user) == Plan.PREMIUM ? premiumMaxChars : freeMaxChars;
    }
}
