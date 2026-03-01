"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import MarketingShell from "@/components/marketing/MarketingShell";
import GlassNavbar from "@/components/marketing/GlassNavbar";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import SectionPill from "@/components/marketing/SectionPill";
import AccentHeading from "@/components/marketing/AccentHeading";
import CTASection from "@/components/marketing/CTASection";
import PlanComparison from "@/components/marketing/PlanComparison";
import FadeInSection from "@/components/reactbits/FadeInSection";

/* ─── Helpers ─── */

type BillingCycle = "monthly" | "yearly";

function cn(...classes: Array<string | undefined | false | null>) {
    return classes.filter(Boolean).join(" ");
}

function fmtUSD(n: number) {
    return `$${n.toFixed(2)}`;
}

/* ─── Page ─── */

export default function PlansPage() {
    const [cycle, setCycle] = React.useState<BillingCycle>("monthly");

    const DISCOUNT_LABEL = "Save 19%";

    /* Base prices */
    const monthly = { premium: 14.99, plus: 29.99 };
    const yearly = { premium: 119.99, plus: 239.99 };

    /* Display prices: yearly shows monthly equivalent + annual total */
    const price = {
        premium:
            cycle === "monthly"
                ? { big: `${fmtUSD(monthly.premium)}/month`, sub: "", badge: undefined as string | undefined }
                : { big: `${fmtUSD(yearly.premium / 12)}/mo`, sub: `Billed annually: ${fmtUSD(yearly.premium)}/yr`, badge: DISCOUNT_LABEL },
        plus:
            cycle === "monthly"
                ? { big: `${fmtUSD(monthly.plus)}/month`, sub: "", badge: undefined as string | undefined }
                : { big: `${fmtUSD(yearly.plus / 12)}/mo`, sub: `Billed annually: ${fmtUSD(yearly.plus)}/yr`, badge: DISCOUNT_LABEL },
    };

    const cycleHint = cycle === "monthly" ? "Billed monthly. Cancel anytime." : "Billed yearly. Save vs monthly.";

    return (
        <MarketingShell>
            <GlassNavbar />

            {/* ─── Hero ─── */}
            <section className="pt-28 pb-12">
                <div className="mx-auto max-w-6xl px-4 md:px-6">
                    <FadeInSection>
                        <div className="text-center">
                            <SectionPill>Pricing</SectionPill>
                            <AccentHeading as="h1" className="mt-5 text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight">
                                {"Pick the Right *Plan*"}
                            </AccentHeading>
                            <p className="mt-5 text-white/60 max-w-2xl mx-auto text-lg">
                                Study with citations, generate practice instantly, and listen with premium voice. Free is intentionally limited;
                                paid tiers are built for daily use.
                            </p>
                        </div>
                    </FadeInSection>

                    {/* Value chips */}
                    <FadeInSection delay={0.06}>
                        <div className="mt-8 grid gap-3 md:grid-cols-3">
                            <ValueChip title="Built for daily studying" desc="Limits tuned for real usage." />
                            <ValueChip title="Faster + higher concurrency" desc="Feels snappy under load." />
                            <ValueChip title="More reliable outputs" desc="Better safeguards and formatting." />
                        </div>
                    </FadeInSection>

                    {/* ─── Billing toggle ─── */}
                    <FadeInSection delay={0.09}>
                        <div className="mt-10 flex items-center justify-center">
                            <div className="relative inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] p-1">
                                <button
                                    onClick={() => setCycle("monthly")}
                                    className={cn(
                                        "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                                        cycle === "monthly" ? "bg-white text-black" : "text-white/70 hover:text-white"
                                    )}
                                >
                                    Monthly
                                </button>

                                <div className="relative">
                                    <button
                                        onClick={() => setCycle("yearly")}
                                        className={cn(
                                            "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                                            cycle === "yearly" ? "bg-white text-black" : "text-white/70 hover:text-white"
                                        )}
                                    >
                                        Yearly
                                    </button>
                                    <span className="absolute -right-2 -top-2 sm:-right-5 sm:-top-3 rounded-full border border-white/[0.12] bg-white/[0.06] px-2 py-1 text-[10px] font-semibold text-white/70">
                                        {DISCOUNT_LABEL}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-2 text-center text-xs text-white/45">{cycleHint}</div>
                    </FadeInSection>

                    {/* ─── Plan cards ─── */}
                    <div id="plans" className="mt-10 grid gap-6 lg:grid-cols-3">
                        {/* Free */}
                        <FadeInSection delay={0.08}>
                            <PlanCard
                                name="Free"
                                subtitle="Try it out with monthly limits."
                                priceLabel="Free"
                                badgeRight="Standard"
                                featured={false}
                                metrics={[
                                    { label: "Study chat", value: "40", sub: "/mo" },
                                    { label: "Generate", value: "10", sub: "/mo" },
                                    { label: "Docs processed", value: "300", sub: "pages/mo" },
                                    { label: "Text-to-speech", value: "10,000", sub: "chars/mo" },
                                ]}
                                bullets={[
                                    "Study Copilot with citations (limited)",
                                    "OCR + PDF extraction included",
                                    "Notes + quizzes (limited)",
                                    "Voice included (monthly cap)",
                                ]}
                                footnote="Paid plans remove monthly caps for normal use — protective rate & concurrency limits still apply to prevent abuse."
                                ctaLabel="Try for Free"
                                ctaHref="/get-started"
                                ctaVariant="ghost"
                                note="No credit card required"
                            />
                        </FadeInSection>

                        {/* Premium (featured) */}
                        <FadeInSection delay={0.11}>
                            <PlanCard
                                name="Premium"
                                subtitle="Daily studying with higher limits and speed."
                                priceLabel={price.premium.big}
                                subPriceLabel={price.premium.sub}
                                yearlyBadge={price.premium.badge}
                                badgeTop="Most popular"
                                badgeRight="Priority"
                                featured
                                glow="blue-aqua"
                                metrics={[
                                    { label: "Study chat", value: "Unlimited" },
                                    { label: "Generate", value: "Unlimited" },
                                    { label: "Docs processed", value: "Unlimited" },
                                    { label: "Text-to-speech", value: "900,000", sub: "chars/mo" },
                                ]}
                                bullets={[
                                    "Unlimited Study chat + generators",
                                    "Generate notes, flashcards, quizzes",
                                    "Faster streaming + higher concurrency",
                                    "Stronger reliability safeguards",
                                ]}
                                footnote="Paid plans remove monthly caps for normal use — protective rate & concurrency limits still apply to prevent abuse."
                                ctaLabel="Upgrade"
                                ctaHref="/billing"
                                ctaVariant="primary"
                                note="Cancel anytime"
                            />
                        </FadeInSection>

                        {/* Premium+ */}
                        <FadeInSection delay={0.14}>
                            <PlanCard
                                name="Premium+"
                                subtitle="Fastest experience + higher voice limits."
                                priceLabel={price.plus.big}
                                subPriceLabel={price.plus.sub}
                                yearlyBadge={price.plus.badge}
                                badgeTop="Best value"
                                badgeRight="Priority"
                                featured={false}
                                glow="purple-blue"
                                metrics={[
                                    { label: "Study chat", value: "Unlimited" },
                                    { label: "Generate", value: "Unlimited" },
                                    { label: "Docs processed", value: "Unlimited" },
                                    { label: "Text-to-speech", value: "2,000,000", sub: "chars/mo" },
                                ]}
                                bullets={[
                                    "Everything in Premium",
                                    "Bigger context + more speed",
                                    "Best for long projects + large materials",
                                    "Highest priority safeguards",
                                ]}
                                footnote="Paid plans remove monthly caps for normal use — protective rate & concurrency limits still apply to prevent abuse."
                                ctaLabel="Upgrade"
                                ctaHref="/billing"
                                ctaVariant="ghost"
                                note="Cancel anytime"
                            />
                        </FadeInSection>
                    </div>
                </div>
            </section>

            {/* ─── Comparison table ─── */}
            <PlanComparison />

            {/* ─── CTA + Footer ─── */}
            <CTASection />
            <MarketingFooter />
        </MarketingShell>
    );
}

/* ─── Value chip ─── */

function ValueChip({ title, desc }: { title: string; desc: string }) {
    return (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
            <div className="font-semibold text-white/90">{title}</div>
            <div className="mt-1 text-sm text-white/50">{desc}</div>
        </div>
    );
}

/* ─── Plan card ─── */

type Metric = { label: string; value: string; sub?: string };

function PlanCard({
    name,
    subtitle,
    priceLabel,
    subPriceLabel,
    yearlyBadge,
    badgeTop,
    badgeRight,
    featured,
    glow = "none",
    metrics,
    bullets,
    footnote,
    ctaLabel,
    ctaHref,
    ctaVariant,
    note,
}: {
    name: string;
    subtitle: string;
    priceLabel: string;
    subPriceLabel?: string;
    yearlyBadge?: string;
    badgeTop?: string;
    badgeRight?: string;
    featured: boolean;
    glow?: "none" | "blue-aqua" | "purple-blue";
    metrics: Metric[];
    bullets: string[];
    footnote?: string;
    ctaLabel: string;
    ctaHref: string;
    ctaVariant: "primary" | "ghost";
    note?: string;
}) {
    return (
        <div
            className={cn(
                "relative h-full rounded-2xl border p-7 overflow-hidden",
                featured
                    ? "border-white/[0.14] bg-white/[0.04]"
                    : "border-white/[0.08] bg-transparent"
            )}
        >
            {/* Glow overlay (non-blocking, behind content) */}
            {glow !== "none" && (
                <div className={cn("card-glow-overlay", glow === "blue-aqua" ? "glow-blue-aqua" : "glow-purple-blue")} />
            )}
            {/* Card content — above glow overlay */}
            <div className="relative z-10">
            {/* Top row: name + badges */}
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-xl font-semibold">{name}</div>
                    <p className="mt-2 text-sm text-white/60">{subtitle}</p>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                    {badgeTop && (
                        <span className={cn(
                            "rounded-full px-3 py-1 text-xs font-semibold",
                            glow === "blue-aqua" ? "border border-blue-400/25 bg-blue-500/10 text-blue-300/80"
                                : glow === "purple-blue" ? "border border-purple-400/25 bg-purple-500/10 text-purple-300/80"
                                : "border border-white/[0.12] bg-white/[0.06] text-white/70"
                        )}>
                            {badgeTop}
                        </span>
                    )}
                    {badgeRight && (
                        <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-white/50">
                            {badgeRight}
                        </span>
                    )}
                </div>
            </div>

            {/* Price */}
            <div className="mt-5">
                <div className="flex items-center justify-between gap-3">
                    <div className="text-2xl font-semibold">{priceLabel}</div>
                    {yearlyBadge && (
                        <span className="rounded-full border border-white/[0.12] bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/70">
                            {yearlyBadge}
                        </span>
                    )}
                </div>
                {subPriceLabel && <div className="mt-2 text-sm text-white/50">{subPriceLabel}</div>}
            </div>

            {/* Metrics grid */}
            <div className="mt-6 grid grid-cols-2 gap-3">
                {metrics.map((m) => (
                    <div key={m.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                        <div className="text-[11px] uppercase tracking-wider text-white/40">{m.label}</div>
                        <div className="mt-1 text-lg font-semibold">{m.value}</div>
                        {m.sub && <div className="text-xs text-white/40">{m.sub}</div>}
                    </div>
                ))}
            </div>

            {/* Bullet features */}
            <ul className="mt-6 space-y-2 text-sm text-white/60">
                {bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                        <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-white/30" />
                        <span>{b}</span>
                    </li>
                ))}
            </ul>

            {/* Footnote */}
            {footnote && (
                <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-xs text-white/50">
                    <span className="font-semibold text-white/70">Unlimited:</span> {footnote}
                </div>
            )}

            {/* CTA button */}
            <div className="mt-6">
                <Link
                    href={ctaHref}
                    className={cn(
                        "flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-opacity",
                        ctaVariant === "primary"
                            ? "bg-white text-black hover:opacity-90"
                            : "border border-white/[0.12] bg-white/[0.04] text-white/80 hover:bg-white/[0.08]"
                    )}
                >
                    {ctaLabel}
                    <ArrowRight className="h-4 w-4" />
                </Link>
                <div className="mt-3 text-center text-xs text-white/40">{note ?? ""}</div>
            </div>
            </div>{/* close relative z-10 content wrapper */}
        </div>
    );
}
