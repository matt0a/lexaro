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

    // (Optional) Business tiers for non-text limits if you add them later
    @Value("${app.plans.business.retentionDays:90}")     private int businessRetentionDays;
    @Value("${app.plans.business.maxPages:2000}")        private int businessMaxPages;
    @Value("${app.plans.business.maxSizeMb:500}")        private int businessMaxMb;
    @Value("${app.plans.businessPlus.retentionDays:180}")private int businessPlusRetentionDays;
    @Value("${app.plans.businessPlus.maxPages:4000}")    private int businessPlusMaxPages;
    @Value("${app.plans.businessPlus.maxSizeMb:1000}")   private int businessPlusMaxMb;

    // TTS monthly/legacy caps you already had
    @Value("${app.tts.maxChars.free:50000}")      private int freeMaxChars;
    @Value("${app.tts.maxChars.premium:1000000}") private int premiumMaxChars;

    // NEW: per-document hard caps for TTS by plan
    @Value("${app.tts.caps.free.perDocChars:300000}")         private int freePerDocChars;        // 300k
    @Value("${app.tts.caps.premium.perDocChars:1500000}")     private int premiumPerDocChars;     // 1.5M
    @Value("${app.tts.caps.business.perDocChars:5000000}")    private int businessPerDocChars;    // 5M
    @Value("${app.tts.caps.businessPlus.perDocChars:15000000}") private int businessPlusPerDocChars; // 15M

    // NEW: defaults for TTS behavior
    @Value("${app.tts.defaultEngine:standard}")   private String defaultEngine;     // we default to STANDARD
    @Value("${app.tts.safeChunkChars:3000}")      private int safeChunkChars;       // Polly-safe chunk

    // allowlists (unchanged)
    @Value("${app.dev.adminEmails:}")    private String adminEmailsCsv;
    @Value("${app.unlimited-emails:}")   private String unlimitedEmailsCsv;
    @Value("${app.unlimited.user-ids:}") private String unlimitedUserIdsCsv;

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
        if (isUnlimited(user)) return Plan.BUSINESS_PLUS; // treat unlimited as top tier
        return user != null && user.getPlan() != null ? user.getPlan() : Plan.FREE;
    }

    // Your existing limits (kept for compatibility)
    public int retentionDaysFor(User user) {
        if (isUnlimited(user)) return 36500; // ~100 years
        return switch (effectivePlan(user)) {
            case FREE -> freeRetentionDays;
            case PREMIUM -> premiumRetentionDays;
            case BUSINESS -> businessRetentionDays;
            case BUSINESS_PLUS -> businessPlusRetentionDays;
        };
    }

    public int maxPagesFor(User user) {
        if (isUnlimited(user)) return Integer.MAX_VALUE;
        return switch (effectivePlan(user)) {
            case FREE -> freeMaxPages;
            case PREMIUM -> premiumMaxPages;
            case BUSINESS -> businessMaxPages;
            case BUSINESS_PLUS -> businessPlusMaxPages;
        };
    }

    public long maxBytesFor(User user) {
        if (isUnlimited(user)) return Long.MAX_VALUE;
        int mb = switch (effectivePlan(user)) {
            case FREE -> freeMaxMb;
            case PREMIUM -> premiumMaxMb;
            case BUSINESS -> businessMaxMb;
            case BUSINESS_PLUS -> businessPlusMaxMb;
        };
        return (long) mb * 1024L * 1024L;
    }

    // Existing monthly/legacy cap
    public int ttsMaxCharsFor(User user) {
        if (isUnlimited(user)) return Integer.MAX_VALUE;
        return effectivePlan(user) == Plan.FREE ? freeMaxChars : premiumMaxChars;
    }

    // NEW: per-document cap by plan (use this in text extract + worker)
    public int ttsMaxCharsForPlan(Plan plan) {
        if (plan == null) return freePerDocChars;
        return switch (plan) {
            case FREE -> freePerDocChars;
            case PREMIUM -> premiumPerDocChars;
            case BUSINESS -> businessPerDocChars;
            case BUSINESS_PLUS -> businessPlusPerDocChars;
        };
    }

    // NEW: safe chunk + default engine
    public int ttsSafeChunkChars()       { return safeChunkChars <= 0 ? 3000 : safeChunkChars; }
    public String defaultTtsEngine()     { return (defaultEngine == null || defaultEngine.isBlank()) ? "standard" : defaultEngine.toLowerCase(); }
}
