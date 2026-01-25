"use client";

import React, { useMemo, useState } from "react";
import type { ApiPlan, UnlimitedOrNumber } from "@/lib/plans";
import { toUiPlans } from "@/lib/plans";
import { fmtInt } from "@/lib/number";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";

type Billing = "monthly" | "yearly";
type Mode = "full" | "trialOnly";

type Props = {
    apiPlans?: ApiPlan[];
    currentPlanKey?: ApiPlan;
    mode?: Mode;
};

const PRICES = {
    MONTHLY: { PREMIUM: 14.99, BUSINESS_PLUS: 29.99 },
    YEARLY_TOTAL: { PREMIUM: 145, BUSINESS_PLUS: 290 },
};

const annualPerMonth = (total: number) => total / 12;

const pctSaved = (monthly: number, annualTotal: number) => {
    const fullYear = monthly * 12;
    return Math.round(((fullYear - annualTotal) / fullYear) * 100);
};

export default function PricingGrid({ apiPlans, currentPlanKey, mode = "full" }: Props) {
    const plans = useMemo(() => toUiPlans(apiPlans), [apiPlans]);
    const [billing, setBilling] = useState<Billing>("monthly");
    const router = useRouter();
    const params = useSearchParams();
    const effectiveMode: Mode = params.get("mode") === "trial" ? "trialOnly" : mode;

    const priceDisplay = (key: ApiPlan) => {
        const k = String(key).toUpperCase();
        if (k === "FREE") return "Free";
        if (billing === "monthly") {
            if (k === "PREMIUM") return `$${PRICES.MONTHLY.PREMIUM.toFixed(2)}/month`;
            if (k === "BUSINESS_PLUS") return `$${PRICES.MONTHLY.BUSINESS_PLUS.toFixed(2)}/month`;
        } else {
            if (k === "PREMIUM")
                return `$${annualPerMonth(PRICES.YEARLY_TOTAL.PREMIUM).toFixed(2)}/mo billed annually`;
            if (k === "BUSINESS_PLUS")
                return `$${annualPerMonth(PRICES.YEARLY_TOTAL.BUSINESS_PLUS).toFixed(2)}/mo billed annually`;
        }
        return "";
    };

    const yearlyTotalLine = (key: ApiPlan) => {
        const k = String(key).toUpperCase();
        if (billing !== "yearly") return null;
        if (k === "PREMIUM") return <div className="mt-1 text-xs text-white/65">Total ${PRICES.YEARLY_TOTAL.PREMIUM}/year</div>;
        if (k === "BUSINESS_PLUS") return <div className="mt-1 text-xs text-white/65">Total ${PRICES.YEARLY_TOTAL.BUSINESS_PLUS}/year</div>;
        return null;
    };

    const savingsBadge = (key: ApiPlan) => {
        const k = String(key).toUpperCase();
        if (k === "FREE" || billing !== "yearly") return null;
        const pct =
            k === "PREMIUM"
                ? pctSaved(PRICES.MONTHLY.PREMIUM, PRICES.YEARLY_TOTAL.PREMIUM)
                : pctSaved(PRICES.MONTHLY.BUSINESS_PLUS, PRICES.YEARLY_TOTAL.BUSINESS_PLUS);

        return (
            <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
        Save {pct}%
      </span>
        );
    };

    const fmtLimit = (v: UnlimitedOrNumber) => (v === "Unlimited" ? "Unlimited" : fmtInt(v));
    const suffix = (v: UnlimitedOrNumber, s: string) => (v === "Unlimited" ? "" : s);

    const onCTA = (plan: ApiPlan) => {
        const k = String(plan).toUpperCase();
        if (effectiveMode === "trialOnly") {
            if (k === "PREMIUM") router.push("/trial-offer");
            return;
        }
        if (k === "FREE") router.push("/signup?plan=FREE");
        else router.push(`/signup?plan=${k}&cycle=${billing}`);
    };

    return (
        <div>
            <BillingToggle billing={billing} onChange={setBilling} />

            <div className="mt-6 grid gap-6 md:grid-cols-3" style={{ perspective: 1200 }}>
                {plans.map((p) => {
                    const key = String(p.key).toUpperCase();
                    const isPremium = key === "PREMIUM";
                    const isPlus = key === "BUSINESS_PLUS";
                    const disabledTrialMode = effectiveMode === "trialOnly" && (key === "FREE" || key === "BUSINESS_PLUS");

                    return (
                        <TiltCard key={p.key} featured={!!p.featured} plus={isPlus}>
                            {/* Badges */}
                            {isPremium && (
                                <div className="pointer-events-none absolute top-0 right-6 -translate-y-[60%] z-20">
                  <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-lg ring-2 ring-white/60">
                    Most popular
                  </span>
                                </div>
                            )}
                            {isPlus && (
                                <div className="pointer-events-none absolute top-0 right-6 -translate-y-[60%] z-20">
                  <span className="rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 px-3 py-1 text-xs font-semibold text-white shadow-lg ring-2 ring-white/60">
                    Best value
                  </span>
                                </div>
                            )}

                            <header className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="text-xl font-semibold">{p.name}</h3>
                                    {p.blurb && <p className="mt-1 text-sm text-white/70">{p.blurb}</p>}
                                </div>
                                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                  {p.priority}
                </span>
                            </header>

                            {/* Price */}
                            <div className="mt-4">
                                <div className="text-sm font-medium text-white/90">
                                    {priceDisplay(p.key)}
                                    {savingsBadge(p.key)}
                                </div>
                                {yearlyTotalLine(p.key)}
                            </div>

                            {/* Allowances */}
                            <div className="mt-5 grid grid-cols-2 gap-3">
                                <Stat label="Study chat" value={fmtLimit(p.aiChatMessagesMonthly)} suffix={suffix(p.aiChatMessagesMonthly, "/mo")} />
                                <Stat label="Generate" value={fmtLimit(p.aiGenerationsMonthly)} suffix={suffix(p.aiGenerationsMonthly, "/mo")} />
                                <Stat
                                    label="Docs processed"
                                    value={fmtLimit(p.docPagesProcessedMonthly)}
                                    suffix={suffix(p.docPagesProcessedMonthly, "pages/mo")}
                                />
                                <Stat label="Text-to-speech" value={fmtInt(p.monthlyWords)} suffix="chars/mo" />
                            </div>

                            {/* Bullets */}
                            <ul className="mt-5 space-y-2 text-sm text-white/85">
                                {key === "FREE" ? (
                                    <>
                                        <li>• Study Copilot with citations (limited)</li>
                                        <li>• OCR + PDF extraction included</li>
                                        <li>• Voice + translation included</li>
                                    </>
                                ) : isPremium ? (
                                    <>
                                        <li>• Unlimited Study chat + generators</li>
                                        <li>• Faster streaming + higher concurrency</li>
                                        <li>• Better reliability safeguards</li>
                                    </>
                                ) : (
                                    <>
                                        <li>• Everything in Premium</li>
                                        <li>• Bigger context + more speed</li>
                                        <li>• Best experience for long projects</li>
                                    </>
                                )}
                            </ul>

                            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
                                <span className="font-semibold text-white/90">Unlimited:</span> Paid plans have no monthly caps for normal use,
                                with protective rate & concurrency limits to prevent abuse.
                            </div>

                            {/* CTA */}
                            <button
                                disabled={disabledTrialMode}
                                onClick={() => onCTA(p.key)}
                                className={[
                                    "mt-5 w-full rounded-xl px-4 py-2 font-semibold transition",
                                    disabledTrialMode
                                        ? "cursor-not-allowed bg-white/10 text-white/40"
                                        : key === String(currentPlanKey).toUpperCase()
                                            ? "bg-gray-200 text-gray-900"
                                            : isPlus
                                                ? "bg-white text-gray-900 hover:bg-gray-100"
                                                : isPremium
                                                    ? "bg-blue-600 text-white hover:bg-blue-700"
                                                    : "bg-gray-900 text-white hover:bg-black",
                                ].join(" ")}
                            >
                                {effectiveMode === "trialOnly"
                                    ? key === "PREMIUM"
                                        ? "Start 3-day Premium trial"
                                        : "Unavailable right now"
                                    : key === "FREE"
                                        ? "Try for Free"
                                        : "Upgrade"}
                            </button>

                            <footer className="mt-3 text-center text-xs text-white/55">
                                {p.name === "Free" ? "No credit card required" : "Cancel anytime"}
                            </footer>
                        </TiltCard>
                    );
                })}
            </div>
        </div>
    );
}

function Stat({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
    return (
        <div className="rounded-xl bg-white/5 px-3 py-2 border border-white/10">
            <div className="text-[11px] uppercase tracking-widest text-white/50">{label}</div>
            <div className="mt-0.5 text-lg font-semibold text-white">
                {value}
                {suffix ? <span className="ml-1 text-sm font-medium text-white/60">{suffix}</span> : null}
            </div>
        </div>
    );
}

function BillingToggle({
                           billing,
                           onChange,
                       }: {
    billing: "monthly" | "yearly";
    onChange: (b: "monthly" | "yearly") => void;
}) {
    const active = (key: "monthly" | "yearly") => billing === key;

    return (
        <div className="flex justify-center">
            <div className="relative flex items-center gap-1 rounded-full bg-white/5 p-1 border border-white/10">
                <button
                    type="button"
                    aria-pressed={active("monthly")}
                    onClick={() => onChange("monthly")}
                    className={["relative z-10 rounded-full px-4 py-2 text-sm font-semibold", active("monthly") ? "text-black" : "text-white/75"].join(" ")}
                >
                    Monthly
                </button>
                <button
                    type="button"
                    aria-pressed={active("yearly")}
                    onClick={() => onChange("yearly")}
                    className={["relative z-10 rounded-full px-4 py-2 text-sm font-semibold", active("yearly") ? "text-black" : "text-white/75"].join(" ")}
                >
                    Yearly <span className="ml-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">Save</span>
                </button>

                <motion.div
                    className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-white"
                    animate={{ x: billing === "monthly" ? 0 : "100%" }}
                    transition={{ type: "spring", stiffness: 320, damping: 26 }}
                />
            </div>
        </div>
    );
}

function TiltCard({ children, featured, plus }: { children: React.ReactNode; featured?: boolean; plus?: boolean }) {
    return (
        <motion.div
            className={[
                "relative rounded-[1.25rem] p-6 card",
                featured ? "ring-2 ring-blue-500/35" : "",
                plus ? "ring-2 ring-white/20" : "",
            ].join(" ")}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            whileHover={{ rotateX: 2, rotateY: -2, y: -4 }}
            style={{ transformStyle: "preserve-3d" }}
        >
            {/* subtle top glow */}
            <div className="pointer-events-none absolute inset-0 rounded-[1.25rem] bg-[radial-gradient(600px_250px_at_50%_0%,rgba(255,255,255,.08),transparent)]" />
            <div className="relative">{children}</div>
        </motion.div>
    );
}
