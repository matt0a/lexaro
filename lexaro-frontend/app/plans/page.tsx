// app/plans/page.tsx
"use client";

import React from "react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import FadeInSection from "@/components/reactbits/FadeInSection";
import FloatingLinesBackground from "@/components/reactbits/FloatingLinesBackground";
import FluidGlassSection from "@/components/reactbits/FluidGlassSection";
import StarBorderCard from "@/components/reactbits/StarBorderCard";
import ShimmerButton from "@/components/reactbits/ShimmerButton";

import PlanComparison from "@/components/marketing/PlanComparison";

type BillingCycle = "monthly" | "yearly";

function cn(...classes: Array<string | undefined | false | null>) {
    return classes.filter(Boolean).join(" ");
}

function fmtUSD(n: number) {
    return `$${n.toFixed(2)}`;
}

export default function PlansPage() {
    const [cycle, setCycle] = React.useState<BillingCycle>("monthly");

    const DISCOUNT_LABEL = "Save 19%";

    const monthly = { premium: 14.99, plus: 29.99 };
    const yearly = { premium: 119.99, plus: 239.99 };

    const price = {
        premium:
            cycle === "monthly"
                ? { big: `${fmtUSD(monthly.premium)}/month`, sub: "", badge: undefined as string | undefined }
                : {
                    big: `${fmtUSD(yearly.premium / 12)}/mo`,
                    sub: `Billed annually: ${fmtUSD(yearly.premium)}/yr`,
                    badge: DISCOUNT_LABEL,
                },
        plus:
            cycle === "monthly"
                ? { big: `${fmtUSD(monthly.plus)}/month`, sub: "", badge: undefined as string | undefined }
                : {
                    big: `${fmtUSD(yearly.plus / 12)}/mo`,
                    sub: `Billed annually: ${fmtUSD(yearly.plus)}/yr`,
                    badge: DISCOUNT_LABEL,
                },
    };

    const cycleHint = cycle === "monthly" ? "Billed monthly. Cancel anytime." : "Billed yearly. Save vs monthly.";

    return (
        <main className="bg-black text-white">
            <Navbar />

            <section className="relative overflow-hidden">
                <FloatingLinesBackground />

                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute left-1/2 top-10 h-[520px] w-[980px] -translate-x-1/2 rounded-full bg-sky-500/10 blur-3xl" />
                    <div className="absolute left-1/3 top-44 h-[420px] w-[840px] -translate-x-1/2 rounded-full bg-fuchsia-500/10 blur-3xl" />
                </div>

                <div className="relative z-10 mx-auto max-w-6xl px-4 md:px-6 pt-20 pb-10">
                    <FadeInSection>
                        <p className="text-xs tracking-[0.25em] text-white/60 uppercase">Pricing</p>
                        <h1 className="mt-3 text-4xl md:text-5xl font-semibold">Find your plan</h1>
                        <p className="mt-4 text-white/70 max-w-2xl">
                            Upload PDFs, ask questions with page links, generate{" "}
                            <span className="text-white font-semibold">notes</span>,{" "}
                            <span className="text-white font-semibold">flashcards</span>,{" "}
                            <span className="text-white font-semibold">quizzes</span>, use the{" "}
                            <span className="text-white font-semibold">essay grader</span>, build a{" "}
                            <span className="text-white font-semibold">study calendar</span>, and listen with voice + translation.
                            Free is intentionally limited; Premium tiers feel unlimited in normal use.
                        </p>
                    </FadeInSection>

                    <FadeInSection delay={0.06}>
                        <div className="mt-8 flex items-center justify-center">
                            <div className="relative inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/55 backdrop-blur-md p-1">
                                <button
                                    onClick={() => setCycle("monthly")}
                                    className={cn(
                                        "rounded-full px-4 py-2 text-sm font-semibold transition",
                                        cycle === "monthly" ? "bg-white text-black" : "text-white/70 hover:text-white"
                                    )}
                                >
                                    Monthly
                                </button>

                                <div className="relative">
                                    <button
                                        onClick={() => setCycle("yearly")}
                                        className={cn(
                                            "rounded-full px-4 py-2 text-sm font-semibold transition",
                                            cycle === "yearly" ? "bg-white text-black" : "text-white/70 hover:text-white"
                                        )}
                                    >
                                        Yearly
                                    </button>

                                    <span className="absolute -right-5 -top-3 rounded-full bg-emerald-500/20 border border-emerald-400/25 px-2 py-1 text-[10px] font-semibold text-emerald-200 shadow-[0_10px_30px_rgba(16,185,129,.22)]">
                    {DISCOUNT_LABEL}
                  </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-2 text-center text-xs text-white/45">{cycleHint}</div>
                    </FadeInSection>

                    <div id="plans" className="mt-10 grid gap-6 lg:grid-cols-3">
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
                                    { label: "Text-to-speech", value: "10,000", sub: "words/mo" },
                                ]}
                                bullets={[
                                    "Study Copilot with citations (limited)",
                                    "Notes / flashcards / quizzes (limited)",
                                    "Essay grader + study calendar (limited)",
                                    "OCR + PDF extraction included",
                                    "Voice + translation included",
                                ]}
                                footnote="Paid plans have no monthly caps for normal use, with protective rate & concurrency limits to prevent abuse."
                                ctaLabel="Try for Free"
                                ctaHref="/get-started"
                                ctaVariant="ghost"
                                note="No credit card required"
                            />
                        </FadeInSection>

                        <FadeInSection delay={0.11}>
                            <StarBorderCard alwaysAnimate speed="16s">
                            <PlanCard
                                    name="Premium"
                                    subtitle="Study without limits — built for daily use."
                                    priceLabel={price.premium.big}
                                    subPriceLabel={price.premium.sub}
                                    yearlyBadge={price.premium.badge}
                                    badgeTop="Most popular"
                                    badgeTone="blue"
                                    badgeRight="Priority"
                                    featured
                                    metrics={[
                                        { label: "Study chat", value: "Unlimited" },
                                        { label: "Generate", value: "Unlimited" },
                                        { label: "Docs processed", value: "Unlimited" },
                                        { label: "Text-to-speech", value: "150,000", sub: "words/mo" },
                                    ]}
                                    bullets={[
                                        "Unlimited Study Copilot + generators",
                                        "Notes, flashcards, quizzes (easy/medium/hard)",
                                        "Essay grader + study calendar included",
                                        "Faster streaming + higher concurrency",
                                        "Stronger reliability safeguards",
                                    ]}
                                    footnote="Paid plans have no monthly caps for normal use, with protective rate & concurrency limits to prevent abuse."
                                    ctaLabel="Upgrade"
                                    ctaHref="/billing"
                                    ctaVariant="primary"
                                    note="Cancel anytime"
                                    noOuterShell
                                />
                            </StarBorderCard>
                        </FadeInSection>

                        <FadeInSection delay={0.14}>
                            <PlanCard
                                name="Premium+"
                                subtitle="Faster, bigger, best experience."
                                priceLabel={price.plus.big}
                                subPriceLabel={price.plus.sub}
                                yearlyBadge={price.plus.badge}
                                badgeTop="Best value"
                                badgeTone="pink"
                                badgeRight="Priority"
                                featured={false}
                                metrics={[
                                    { label: "Study chat", value: "Unlimited" },
                                    { label: "Generate", value: "Unlimited" },
                                    { label: "Docs processed", value: "Unlimited" },
                                    { label: "Text-to-speech", value: "350,000", sub: "words/mo" },
                                ]}
                                bullets={[
                                    "Everything in Premium",
                                    "Best for long projects + large materials",
                                    "Highest speed + concurrency limits",
                                    "Highest priority safeguards",
                                ]}
                                footnote="Paid plans have no monthly caps for normal use, with protective rate & concurrency limits to prevent abuse."
                                ctaLabel="Upgrade"
                                ctaHref="/billing"
                                ctaVariant="ghost"
                                note="Cancel anytime"
                            />
                        </FadeInSection>
                    </div>
                </div>
            </section>

            <PlanComparison />

            <FluidGlassSection tone="violet">
                <div className="mx-auto max-w-6xl px-4 md:px-6 py-20">
                    <FadeInSection>
                        <div className="rounded-3xl border border-white/10 bg-black/55 backdrop-blur-md p-8 text-center">
                            <h3 className="text-2xl md:text-3xl font-semibold">Ready to try Lexaro Learn?</h3>
                            <p className="mt-3 text-white/70 max-w-2xl mx-auto">
                                Upload a PDF, ask questions with page links, generate notes + quizzes, get essay feedback,
                                build a study plan, and listen with voice previews.
                            </p>
                            <div className="mt-6 flex flex-wrap justify-center gap-3">
                                <ShimmerButton href="/get-started" variant="primary">
                                    Try it free
                                </ShimmerButton>
                                <ShimmerButton href="/about/features" variant="ghost">
                                    Full feature list
                                </ShimmerButton>
                            </div>
                            <p className="mt-3 text-xs text-white/45">Free is limited.</p>
                        </div>
                    </FadeInSection>
                </div>
            </FluidGlassSection>

            <Footer />
        </main>
    );
}

type Metric = { label: string; value: string; sub?: string };

function PlanCard({
                      name,
                      subtitle,
                      priceLabel,
                      subPriceLabel,
                      yearlyBadge,
                      badgeTop,
                      badgeTone = "gray",
                      badgeRight,
                      featured,
                      metrics,
                      bullets,
                      footnote,
                      ctaLabel,
                      ctaHref,
                      ctaVariant,
                      note,
                      noOuterShell,
                  }: {
    name: string;
    subtitle: string;
    priceLabel: string;
    subPriceLabel?: string;
    yearlyBadge?: string;
    badgeTop?: string;
    badgeTone?: "blue" | "pink" | "gray";
    badgeRight?: string;
    featured: boolean;
    metrics: Metric[];
    bullets: string[];
    footnote?: string;
    ctaLabel: string;
    ctaHref: string;
    ctaVariant: "primary" | "ghost";
    note?: string;
    noOuterShell?: boolean;
}) {
    return (
        <div
            className={cn(
                "h-full",
                noOuterShell
                    ? ""
                    : "rounded-3xl border border-white/10 bg-black/55 backdrop-blur-md shadow-[0_26px_90px_rgba(0,0,0,.7)]"
            )}
        >
            <div className="p-7">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="text-xl font-semibold">{name}</div>
                        <p className="mt-2 text-sm text-white/70">{subtitle}</p>
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                        {badgeTop ? (
                            <span
                                className={cn(
                                    "rounded-full px-3 py-1 text-xs font-semibold border",
                                    badgeTone === "blue" && "bg-sky-500/15 text-sky-200 border-sky-400/25",
                                    badgeTone === "pink" && "bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-400/25",
                                    badgeTone === "gray" && "bg-white/5 text-white/70 border-white/10"
                                )}
                            >
                {badgeTop}
              </span>
                        ) : null}

                        {badgeRight ? (
                            <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-white/70">
                {badgeRight}
              </span>
                        ) : null}
                    </div>
                </div>

                <div className="mt-5">
                    <div className="flex items-center justify-between gap-3">
                        <div className="text-2xl font-semibold">{priceLabel}</div>
                        {yearlyBadge ? (
                            <span className="rounded-full bg-emerald-500/15 border border-emerald-400/25 px-3 py-1 text-xs font-semibold text-emerald-200">
                {yearlyBadge}
              </span>
                        ) : null}
                    </div>

                    {subPriceLabel ? <div className="mt-2 text-sm text-white/60">{subPriceLabel}</div> : null}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                    {metrics.map((m) => (
                        <div key={m.label} className="rounded-2xl border border-white/10 bg-black/55 p-4">
                            <div className="text-[11px] uppercase tracking-wider text-white/55">{m.label}</div>
                            <div className="mt-1 text-lg font-semibold">{m.value}</div>
                            {m.sub ? <div className="text-xs text-white/55">{m.sub}</div> : null}
                        </div>
                    ))}
                </div>

                <ul className="mt-6 space-y-2 text-sm text-white/75">
                    {bullets.map((b) => (
                        <li key={b} className="flex gap-2">
                            <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-white/40" />
                            <span>{b}</span>
                        </li>
                    ))}
                </ul>

                {footnote ? (
                    <div className="mt-5 rounded-2xl border border-white/10 bg-black/55 p-4 text-xs text-white/65">
                        <span className="font-semibold text-white/80">Unlimited:</span> {footnote}
                    </div>
                ) : null}

                <div className="mt-6">
                    <ShimmerButton href={ctaHref} variant={ctaVariant} className="w-full justify-center">
                        {ctaLabel}
                    </ShimmerButton>

                    <div className="mt-3 text-center text-xs text-white/55">{note ?? (featured ? "Cancel anytime" : "")}</div>
                </div>
            </div>
        </div>
    );
}
