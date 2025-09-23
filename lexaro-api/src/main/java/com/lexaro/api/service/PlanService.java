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

    // --- Business tiers (for non-text limits; you already planned these) ---
    @Value("${app.plans.business.retentionDays:90}")      private int businessRetentionDays;
    @Value("${app.plans.business.maxPages:2000}")         private int businessMaxPages;
    @Value("${app.plans.business.maxSizeMb:500}")         private int businessMaxMb;
    @Value("${app.plans.businessPlus.retentionDays:180}") private int businessPlusRetentionDays;
    @Value("${app.plans.businessPlus.maxPages:4000}")     private int businessPlusMaxPages;
    @Value("${app.plans.businessPlus.maxSizeMb:1000}")    private int businessPlusMaxMb;

    // Legacy monthly caps you already had (kept for compatibility)
    @Value("${app.tts.maxChars.free:50000}")      private int freeMaxChars;
    @Value("${app.tts.maxChars.premium:1000000}") private int premiumMaxChars;

    // NEW: per-document hard caps for TTS by plan
    @Value("${app.tts.caps.free.perDocChars:300000}")            private int freePerDocChars;
    @Value("${app.tts.caps.premium.perDocChars:1500000}")        private int premiumPerDocChars;
    @Value("${app.tts.caps.business.perDocChars:5000000}")       private int businessPerDocChars;
    @Value("${app.tts.caps.businessPlus.perDocChars:15000000}")  private int businessPlusPerDocChars;

    // NEW: monthly caps used by TtsQuotaService
    @Value("${app.tts.monthly.free:50000}")            private long monthFree;
    @Value("${app.tts.monthly.premium:600000}")        private long monthPremium;
    @Value("${app.tts.monthly.business:1800000}")      private long monthBusiness;
    @Value("${app.tts.monthly.businessPlus:3600000}")  private long monthBusinessPlus;

    // NEW: defaults for TTS behavior
    @Value("${app.tts.defaultEngine:standard}")   private String defaultEngine;     // default = STANDARD
    @Value("${app.tts.defaultVoice:Joanna}")      private String defaultVoice;      // default = Joanna
    @Value("${app.tts.safeChunkChars:3000}")      private int safeChunkChars;       // provider-safe chunk

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

    public int retentionDaysFor(User user) {
        if (isUnlimited(user)) return 36500; // ~100 years
        return switch (effectivePlan(user)) {
            case FREE          -> freeRetentionDays;
            case PREMIUM       -> premiumRetentionDays;
            case BUSINESS      -> businessRetentionDays;
            case BUSINESS_PLUS -> businessPlusRetentionDays;
        };
    }

    public int maxPagesFor(User user) {
        if (isUnlimited(user)) return Integer.MAX_VALUE;
        return switch (effectivePlan(user)) {
            case FREE          -> freeMaxPages;
            case PREMIUM       -> premiumMaxPages;
            case BUSINESS      -> businessMaxPages;
            case BUSINESS_PLUS -> businessPlusMaxPages;
        };
    }

    public long maxBytesFor(User user) {
        if (isUnlimited(user)) return Long.MAX_VALUE;
        int mb = switch (effectivePlan(user)) {
            case FREE          -> freeMaxMb;
            case PREMIUM       -> premiumMaxMb;
            case BUSINESS      -> businessMaxMb;
            case BUSINESS_PLUS -> businessPlusMaxMb;
        };
        return (long) mb * 1024L * 1024L;
    }

    // Legacy monthly/compat cap (you can keep or deprecate later)
    public int ttsMaxCharsFor(User user) {
        if (isUnlimited(user)) return Integer.MAX_VALUE;
        return effectivePlan(user) == Plan.FREE ? freeMaxChars : premiumMaxChars;
    }

    // --- NEW: per-document cap by plan (used in extractor/worker trims) ---
    public int ttsMaxCharsForPlan(Plan plan) {
        if (plan == null) return freePerDocChars;
        return switch (plan) {
            case FREE          -> freePerDocChars;
            case PREMIUM       -> premiumPerDocChars;
            case BUSINESS      -> businessPerDocChars;
            case BUSINESS_PLUS -> businessPlusPerDocChars;
        };
    }

    // --- NEW: monthly cap by plan (used by TtsQuotaService) ---
    public long monthlyCapForPlan(Plan plan) {
        if (plan == null) return monthFree;
        return switch (plan) {
            case FREE          -> monthFree;
            case PREMIUM       -> monthPremium;
            case BUSINESS      -> monthBusiness;
            case BUSINESS_PLUS -> monthBusinessPlus;
        };
    }

    // --- NEW: defaults/safety helpers used by worker ---
    public int    ttsSafeChunkChars() { return safeChunkChars <= 0 ? 3000 : safeChunkChars; }
    public String defaultTtsEngine()  { return (defaultEngine == null || defaultEngine.isBlank()) ? "standard" : defaultEngine.toLowerCase(); }
    public String defaultTtsVoice()   { return (defaultVoice == null || defaultVoice.isBlank()) ? "Joanna"   : defaultVoice; }
}
