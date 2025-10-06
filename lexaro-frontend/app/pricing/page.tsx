import React from "react";
import PricingGrid from "../../components/billing/PricingGrid";
// If you later fetch plans from your API, pass them into <PricingGrid apiPlans={...} />

export default function PricingPage() {
    // For now we just show the three public plans.
    const apiPlans = ["FREE", "PREMIUM", "BUSINESS_PLUS"] as const;

    const handleSelect = (planKey: string) => {
        // TODO: wire to your backend (subscribe/upgrade)
        // Example: await api.post('/billing/subscribe', { plan: planKey })
        console.log("Select plan:", planKey);
    };

    return (
        <main className="mx-auto max-w-6xl px-4 py-10">
            <h1 className="mb-2 text-3xl font-bold">Choose your plan</h1>
            <p className="mb-8 max-w-2xl text-gray-600">
                We show three plans on the site: <strong>Free</strong>, <strong>Premium</strong>, and <strong>Premium+</strong>.
                Limits are measured in <strong>words per month</strong>; daily caps are <strong>unlimited</strong>.
            </p>

            <PricingGrid apiPlans={apiPlans as any} currentPlanKey={"FREE"} onSelectPlan={handleSelect} />
        </main>
    );
}
