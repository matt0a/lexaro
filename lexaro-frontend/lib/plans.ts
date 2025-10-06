export type ApiPlan = "FREE" | "PREMIUM" | "BUSINESS_PLUS" | string;

export type UiPlan = {
    key: ApiPlan;
    name: string;          // Display label
    monthlyWords: number;  // Allowance shown on the UI
    dailyLimit: "Unlimited" | number;
    featured?: boolean;    // Optional styling flag
    blurb?: string;        // Short description
};

export const VISIBLE_PLANS: ApiPlan[] = ["FREE", "PREMIUM", "BUSINESS_PLUS"];

export const DISPLAY_NAME: Record<string, string> = {
    FREE: "Free",
    PREMIUM: "Premium",
    BUSINESS_PLUS: "Premium+",
};

export const PLAN_LIMITS: Record<string, number> = {
    FREE: 10_000,
    PREMIUM: 150_000,
    BUSINESS_PLUS: 350_000,
};

// Daily = Unlimited for all three
export const DAILY_DISPLAY: Record<string, "Unlimited" | number> = {
    FREE: "Unlimited",
    PREMIUM: "Unlimited",
    BUSINESS_PLUS: "Unlimited",
};

// Optional blurbs
export const PLAN_BLURBS: Record<string, string> = {
    FREE: "Great for trying Lexaro on short docs.",
    PREMIUM: "Best value for frequent readers.",
    BUSINESS_PLUS: "For power users & long projects.",
};

export function toUiPlans(apiPlans?: ApiPlan[]): UiPlan[] {
    const keys = (apiPlans && apiPlans.length ? apiPlans : VISIBLE_PLANS)
        .filter((p) => VISIBLE_PLANS.includes(p as ApiPlan));

    return keys.map((key) => ({
        key,
        name: DISPLAY_NAME[key] ?? key,
        monthlyWords: PLAN_LIMITS[key],
        dailyLimit: DAILY_DISPLAY[key],
        featured: key === "PREMIUM", // make Premium pop
        blurb: PLAN_BLURBS[key],
    }));
}
