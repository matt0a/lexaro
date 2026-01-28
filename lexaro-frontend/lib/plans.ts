export type ApiPlan = "FREE" | "PREMIUM" | "BUSINESS_PLUS" | string;

export type UnlimitedOrNumber = "Unlimited" | number;

export type UiPlan = {
    key: ApiPlan;
    name: string;

    /**
     * Voice allowance shown on pricing
     * (kept for compatibility with existing UI)
     */
    monthlyWords: number;
    dailyLimit: "Unlimited" | number;

    featured?: boolean;
    blurb?: string;

    /** Lexaro Learn limits */
    aiChatMessagesMonthly: UnlimitedOrNumber;
    aiGenerationsMonthly: UnlimitedOrNumber;
    docPagesProcessedMonthly: UnlimitedOrNumber;

    /** “Unlimited feel” knobs */
    maxConcurrentStreams: number;
    priority: "Standard" | "Priority";
};

export const VISIBLE_PLANS: ApiPlan[] = ["FREE", "PREMIUM", "BUSINESS_PLUS"];

export const DISPLAY_NAME: Record<string, string> = {
    FREE: "Free",
    PREMIUM: "Premium",
    BUSINESS_PLUS: "Premium+",
};

/**
 * Voice chars/mo (keep as-is if already used elsewhere)
 */
export const PLAN_LIMITS: Record<string, number> = {
    FREE: 10_000,
    PREMIUM: 900_000,
    BUSINESS_PLUS: 2_000_000,
};

/**
 * Lexaro Learn quotas (Free should feel restrictive)
 */
export const AI_CHAT_MESSAGES_MONTHLY: Record<string, UnlimitedOrNumber> = {
    FREE: 40,
    PREMIUM: "Unlimited",
    BUSINESS_PLUS: "Unlimited",
};

export const AI_GENERATIONS_MONTHLY: Record<string, UnlimitedOrNumber> = {
    FREE: 10,
    PREMIUM: "Unlimited",
    BUSINESS_PLUS: "Unlimited",
};

export const DOC_PAGES_PROCESSED_MONTHLY: Record<string, UnlimitedOrNumber> = {
    FREE: 300,
    PREMIUM: "Unlimited",
    BUSINESS_PLUS: "Unlimited",
};

export const MAX_CONCURRENT_STREAMS: Record<string, number> = {
    FREE: 1,
    PREMIUM: 2,
    BUSINESS_PLUS: 4,
};

export const PRIORITY: Record<string, UiPlan["priority"]> = {
    FREE: "Standard",
    PREMIUM: "Priority",
    BUSINESS_PLUS: "Priority",
};

export const DAILY_DISPLAY: Record<string, "Unlimited" | number> = {
    FREE: "Unlimited",
    PREMIUM: "Unlimited",
    BUSINESS_PLUS: "Unlimited",
};

export const PLAN_BLURBS: Record<string, string> = {
    FREE: "Try it out with monthly limits.",
    PREMIUM: "Study without limits — built for daily use.",
    BUSINESS_PLUS: "Faster, bigger, best experience.",
};

export function toUiPlans(apiPlans?: ApiPlan[]): UiPlan[] {
    const keys = (apiPlans && apiPlans.length ? apiPlans : VISIBLE_PLANS).filter((p) =>
        VISIBLE_PLANS.includes(p as ApiPlan)
    );

    return keys.map((key) => ({
        key,
        name: DISPLAY_NAME[key] ?? key,
        monthlyWords: PLAN_LIMITS[key],
        dailyLimit: DAILY_DISPLAY[key],
        featured: String(key).toUpperCase() === "PREMIUM",
        blurb: PLAN_BLURBS[key],

        aiChatMessagesMonthly: AI_CHAT_MESSAGES_MONTHLY[key] ?? 0,
        aiGenerationsMonthly: AI_GENERATIONS_MONTHLY[key] ?? 0,
        docPagesProcessedMonthly: DOC_PAGES_PROCESSED_MONTHLY[key] ?? 0,

        maxConcurrentStreams: MAX_CONCURRENT_STREAMS[key] ?? 1,
        priority: PRIORITY[key] ?? "Standard",
    }));
}
