// app/plans/page.tsx
"use client";

import React from "react";
import Navbar from "../../components/Navbar";
import PricingGrid from "../../components/billing/PricingGrid";
import PremiumBanner from "../../components/marketing/PremiumBanner";
import PlanComparison from "../../components/marketing/PlanComparison";
import { useSearchParams } from "next/navigation";

export default function PlansPage() {
    const params = useSearchParams();
    const mode = params.get("mode") === "trial" ? ("trialOnly" as const) : ("full" as const);
    const apiPlans = ["FREE", "PREMIUM", "BUSINESS_PLUS"] as const;

    return (
        <main className="min-h-screen bg-black text-white pb-16">
            <Navbar />
            <section className="mx-auto max-w-6xl px-4 pt-24" id="plans">
                <h1 className="mb-2 text-3xl font-bold">Choose your plan</h1>
                <p className="mb-8 max-w-2xl text-gray-400">
                    Limits are measured in <strong>words per month</strong>. No daily caps.
                </p>
                <PricingGrid apiPlans={apiPlans as any} currentPlanKey={"FREE"} mode={mode} />
            </section>

            {/* Optional: keep these below; they'll still be informative in trial mode */}
            <PremiumBanner />
            <PlanComparison />
        </main>
    );
}
