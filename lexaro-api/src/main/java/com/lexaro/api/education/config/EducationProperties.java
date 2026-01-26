package com.lexaro.api.education.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@Data
@ConfigurationProperties(prefix = "app.education")
public class EducationProperties {

    private Chunk chunk = new Chunk();
    private Retrieval retrieval = new Retrieval();
    private Limits limits = new Limits();
    private Features features = new Features();

    /**
     * Backwards-compatible helpers for services that call these.
     * (Your DocumentIndexServiceImpl uses these names.)
     */
    public int getDefaultChunkChars() {
        return chunk.targetChars;
    }

    public int getDefaultOverlapChars() {
        return chunk.overlapChars;
    }

    @Data
    public static class Chunk {
        /** target chunk size in characters */
        private int targetChars = 1200;
        /** overlap between chunks in characters */
        private int overlapChars = 200;
        /** 0 = no limit; otherwise max pages extracted for indexing */
        private int maxPages = 0;
    }

    @Data
    public static class Retrieval {
        /** how many chunks to return for grounding */
        private int maxChunks = 5;
        /** safety cap for returning chunk text to callers */
        private int maxCharsPerChunk = 2500;
    }

    @Data
    public static class Limits {

        /**
         * NOTE:
         * - dailyRequests = 0 means "unlimited" (no daily cap)
         * - monthlyTokens is a "safety fuse" to prevent abuse.
         *
         * Plans:
         * FREE, PREMIUM, PREMIUM+
         *
         * Backend may still contain:
         * FREE, PREMIUM, BUSINESS, BUSINESS_PLUS
         *
         * We treat BUSINESS and BUSINESS_PLUS as PREMIUM+ (aliases).
         */
        private PlanLimit free = new PlanLimit(20, 50_000);

        // "Unlimited" feel: no daily cap, high monthly fuse.
        private PlanLimit premium = new PlanLimit(0, 2_000_000);

        // Alias: if BUSINESS still exists in DB from older test users.
        private PlanLimit business = new PlanLimit(0, 6_000_000);

        // PREMIUM+ maps here
        private PlanLimit businessPlus = new PlanLimit(0, 6_000_000);

        @Data
        public static class PlanLimit {
            /**
             * total AI-feature requests/day (chat/quiz/notes/essay/etc.)
             * 0 = unlimited
             */
            private int dailyRequests;

            /** total tokens/month across AI features; 0 = unlimited */
            private long monthlyTokens;

            public PlanLimit() { }

            public PlanLimit(int dailyRequests, long monthlyTokens) {
                this.dailyRequests = dailyRequests;
                this.monthlyTokens = monthlyTokens;
            }
        }
    }

    @Data
    public static class Features {
        /** master kill-switch for education AI calls */
        private boolean aiEnabled = true;

        /**
         * which plans can use AI features (free can still index/search)
         *
         * Keep BUSINESS/BUSINESS_PLUS here as aliases for PREMIUM+.
         */
        private List<String> aiAllowedPlans = List.of("PREMIUM", "BUSINESS", "BUSINESS_PLUS");
    }
}
