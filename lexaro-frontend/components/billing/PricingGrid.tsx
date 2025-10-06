"use client";

import React, { useState } from "react";
import type { ApiPlan } from "../../lib/plans";
import { toUiPlans } from "../../lib/plans";
import { fmtInt } from "../../lib/number";
import PlanPill from "./PlanPill";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";

type Billing = "monthly" | "yearly";
type Mode = "full" | "trialOnly"; // full = /plans (no trials shown), trialOnly = post-onboarding gate

type Props = {
    apiPlans?: ApiPlan[];
    currentPlanKey?: ApiPlan;
    mode?: Mode;
};

const PRICES = {
    MONTHLY: {
        PREMIUM: 14.99,
        BUSINESS_PLUS: 29.99,
    },
    YEARLY_TOTAL: {
        PREMIUM: 145, // $12.09/mo billed annually
        BUSINESS_PLUS: 290, // ~$24.17/mo billed annually
    },
};

const annualPerMonth = (total: number) => total / 12;
const pctSaved = (monthly: number, annualTotal: number) => {
    const fullYear = monthly * 12;
    return Math.round(((fullYear - annualTotal) / fullYear) * 100);
};

export default function PricingGrid({ apiPlans, currentPlanKey, mode = "full" }: Props) {
    const plans = toUiPlans(apiPlans);
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
                return `$${annualPerMonth(PRICES.YEARLY_TOTAL.PREMIUM).toFixed(2)}/month billed annually`;
            if (k === "BUSINESS_PLUS")
                return `$${annualPerMonth(PRICES.YEARLY_TOTAL.BUSINESS_PLUS).toFixed(2)}/month billed annually`;
        }
        return "";
    };

    const yearlyTotalLine = (key: ApiPlan) => {
        const k = String(key).toUpperCase();
        if (billing !== "yearly") return null;
        if (k === "PREMIUM")
            return <div className="mt-1 text-xs text-white/70">Total ${PRICES.YEARLY_TOTAL.PREMIUM}/year</div>;
        if (k === "BUSINESS_PLUS")
            return <div className="mt-1 text-xs text-white/70">Total ${PRICES.YEARLY_TOTAL.BUSINESS_PLUS}/year</div>;
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
            <span className="ml-2 rounded-full bg-green-600/20 px-2 py-0.5 text-[10px] font-semibold text-green-400">
        Save {pct}%
      </span>
        );
    };

    const onCTA = (plan: ApiPlan) => {
        const k = String(plan).toUpperCase();
        if (effectiveMode === "trialOnly") {
            // post-onboarding: only Premium yearly trial allowed
            if (k === "PREMIUM") router.push("/trial-offer");
            return;
        }
        // /plans page: no trials shown; direct to signup/checkout flows
        if (k === "FREE") router.push("/signup?plan=FREE");
        else router.push(`/signup?plan=${k}&cycle=${billing}`);
    };

    return (
        <div>
            {/* Animated billing toggle (badge always visible) */}
            <BillingToggle billing={billing} onChange={setBilling} />

            {/* Push the grid down so pills/toggle never overlap */}
            <div className="mt-6 grid gap-6 md:grid-cols-3" style={{ perspective: 1200 }}>
                {plans.map((p) => {
                    const key = String(p.key).toUpperCase();
                    const isPremium = key === "PREMIUM";
                    const isPlus = key === "BUSINESS_PLUS";
                    const disabledTrialMode = effectiveMode === "trialOnly" && (key === "FREE" || key === "BUSINESS_PLUS");

                    return (
                        <TiltCard key={p.key} variant={isPlus ? "premiumPlus" : isPremium ? "premium" : "default"}>
                            {/* top-right pills across the border */}
                            {isPremium && (
                                <div className="pointer-events-none absolute top-0 right-6 -translate-y-[190%] z-20">
                  <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-lg ring-2 ring-white/60">
                    Most popular
                  </span>
                                </div>
                            )}
                            {isPlus && (
                                <div className="pointer-events-none absolute top-0 right-6 -translate-y-[190%] z-20">
                  <span className="rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 px-3 py-1 text-xs font-semibold text-white shadow-lg ring-2 ring-white/60">
                    Best value
                  </span>
                                </div>
                            )}

                            {/* rainbow sweep on hover for premium tiers */}
                            {(isPremium || isPlus) && <RainbowSweep />}

                            <header className="mb-3 mt-2 flex items-center justify-between">
                                <h3 className="text-xl font-semibold">{p.name}</h3>
                                <PlanPill>{p.dailyLimit === "Unlimited" ? "Daily: Unlimited" : `Daily: ${p.dailyLimit}`}</PlanPill>
                            </header>

                            <div className="text-sm text-white/70">Monthly allowance</div>
                            <div className="text-3xl font-bold">
                                {fmtInt(p.monthlyWords)} <span className="text-base font-medium text-gray-500">words</span>
                            </div>

                            {/* price line */}
                            <div className="mt-3 text-sm font-medium text-white/90">
                                {priceDisplay(p.key)}
                                {savingsBadge(p.key)}
                            </div>
                            {/* yearly totals (no trial wording on /plans) */}
                            {yearlyTotalLine(p.key)}

                            {/* bullets */}
                            <ul className="mt-4 space-y-2 text-sm">
                                {key === "FREE" ? (
                                    <>
                                        <li>• Robotic/basic voices</li>
                                        <li>• Core text-to-speech features</li>
                                        <li>• Good for short, simple docs</li>
                                    </>
                                ) : isPremium ? (
                                    <>
                                        <li>• Natural, high-quality voices</li>
                                        <li>• 60+ languages & accents</li>
                                        <li>• Smooth rendering while you work</li>
                                    </>
                                ) : (
                                    <>
                                        <li>• Studio-grade & Pro voices</li>
                                        <li>• 60+ languages & accents</li>
                                        <li>• Priority rendering for long projects</li>
                                    </>
                                )}
                            </ul>

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

                            <footer className="mt-3 text-center text-xs text-gray-500">
                                {p.name === "Free" ? "No credit card required" : "Cancel anytime"}
                            </footer>
                        </TiltCard>
                    );
                })}
            </div>
        </div>
    );
}

/* ============ Animated billing toggle (badge always visible) ============ */

function BillingToggle({
                           billing,
                           onChange,
                       }: {
    billing: "monthly" | "yearly";
    onChange: (b: "monthly" | "yearly") => void;
}) {
    const active = (key: "monthly" | "yearly") => billing === key;

    return (
        <div className="mb-2 flex justify-center">
            <div className="relative flex items-center gap-1 rounded-full bg-white/5 p-1">
                {/* Monthly */}
                <button
                    type="button"
                    aria-pressed={active("monthly")}
                    onClick={() => onChange("monthly")}
                    className={[
                        "relative overflow-hidden rounded-full px-4 py-1 text-sm font-semibold",
                        active("monthly") ? "text-white" : "text-gray-300 hover:text-white",
                    ].join(" ")}
                >
                    {active("monthly") && (
                        <motion.div
                            layoutId="billing-pill"
                            className="absolute inset-0 rounded-full bg-blue-600"
                            transition={{ type: "spring", stiffness: 400, damping: 34, mass: 0.5 }}
                        />
                    )}
                    <span className="relative z-10">Monthly</span>
                </button>

                {/* Yearly */}
                <button
                    type="button"
                    aria-pressed={active("yearly")}
                    onClick={() => onChange("yearly")}
                    className={[
                        "relative overflow-hidden rounded-full px-4 py-1 text-sm font-semibold",
                        active("yearly") ? "text-white" : "text-gray-300 hover:text-white",
                    ].join(" ")}
                >
                    {active("yearly") && (
                        <motion.div
                            layoutId="billing-pill"
                            className="absolute inset-0 rounded-full bg-blue-600"
                            transition={{ type: "spring", stiffness: 400, damping: 34, mass: 0.5 }}
                        />
                    )}
                    <span className="relative z-10">Yearly</span>
                    {/* Badge is ALWAYS visible */}
                    <span
                        className={[
                            "relative z-10 ml-2 rounded-full bg-green-600/20 px-2 py-0.5 text-[10px] font-semibold text-green-400",
                            active("yearly") ? "opacity-100" : "opacity-100",
                        ].join(" ")}
                    >
            Save ~19%
          </span>
                </button>
            </div>
        </div>
    );
}

/* ============ Hover effects & premium+ border ============ */

function RainbowSweep() {
    return (
        <motion.div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-2xl">
            <motion.div
                className="absolute -inset-x-1 top-0 h-[140%] -translate-y-1/5 opacity-0"
                style={{
                    background:
                        "linear-gradient(90deg, rgba(255,0,122,.25), rgba(255,154,0,.25), rgba(255,255,0,.25), rgba(0,255,128,.25), rgba(0,153,255,.25), rgba(170,102,255,.25))",
                    filter: "blur(18px)",
                }}
                initial={{ x: "-120%" }}
                whileHover={{ x: ["-120%", "120%"], opacity: [0, 1, 0] }}
                transition={{ duration: 1.8, ease: "linear", repeat: Infinity }}
            />
        </motion.div>
    );
}

/** Card with tilt pop & premium+ gradient border */
function TiltCard({
                      children,
                      variant = "default",
                  }: {
    children: React.ReactNode;
    variant?: "default" | "premium" | "premiumPlus";
}) {
    const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

    const onMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const cx = (e.clientX - r.left) / r.width - 0.5;
        const cy = (e.clientY - r.top) / r.height - 0.5;
        setTilt({ rx: cy * -6, ry: cx * 6 });
    };

    const premiumPlusBorder =
        variant === "premiumPlus" ? (
            <>
                {/* colorful gradient ring */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute -inset-[2px] rounded-2xl"
                    style={{
                        background:
                            "linear-gradient(135deg, #f0abfc 0%, #60a5fa 40%, #22d3ee 60%, #34d399 100%)",
                        filter: "blur(0.6px)",
                        zIndex: 0,
                    }}
                />
                {/* inner surface */}
                <div className="pointer-events-none absolute inset-[2px] z-[1] rounded-2xl bg-black" />
                {/* soft glow */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute -inset-3 z-0 rounded-3xl"
                    style={{
                        background:
                            "radial-gradient(60% 60% at 50% 0%, rgba(96,165,250,.25), rgba(52,211,153,.15), rgba(0,0,0,0) 70%)",
                        filter: "blur(22px)",
                    }}
                />
            </>
        ) : null;

    const nonPlusShadow =
        variant === "premium"
            ? "0 0 0 2px rgba(59,130,246,0.7), 0 12px 40px rgba(59,130,246,0.18)"
            : "0 0 0 1px rgba(255,255,255,0.08)";

    return (
        <motion.article
            onMouseMove={onMove}
            onMouseLeave={() => setTilt({ rx: 0, ry: 0 })}
            className={[
                "relative overflow-visible rounded-2xl border border-white/10 p-6 shadow-sm transition-colors",
                "transform-gpu will-change-transform",
            ].join(" ")}
            style={{ transformStyle: "preserve-3d" }}
            initial={{ scale: 1, y: 0, rotateX: 0, rotateY: 0 }}
            animate={{ rotateX: tilt.rx, rotateY: tilt.ry }}
            whileHover={{
                scale: 1.045,
                y: -6,
                boxShadow: variant === "premiumPlus" ? "0 10px 25px rgba(0,0,0,0.35)" : nonPlusShadow,
            }}
            transition={{ type: "spring", stiffness: 220, damping: 20, mass: 0.6 }}
        >
            {premiumPlusBorder}
            {variant !== "premiumPlus" && (
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-2xl"
                    style={{ boxShadow: nonPlusShadow, zIndex: 0 }}
                />
            )}
            <div className="relative z-[2]">{children}</div>
        </motion.article>
    );
}
