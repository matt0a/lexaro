"use client";

import React from "react";
import Link from "next/link";
import {
    ArrowRight,
    BookOpen,
    CheckCircle2,
    FileText,
    Headphones,
    MessageSquare,
    Sparkles,
    Star,
    Zap,
} from "lucide-react";

import MarketingShell from "@/components/marketing/MarketingShell";
import GlassNavbar from "@/components/marketing/GlassNavbar";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import SectionPill from "@/components/marketing/SectionPill";
import AccentHeading from "@/components/marketing/AccentHeading";
import GlassCard from "@/components/marketing/GlassCard";
import CTASection from "@/components/marketing/CTASection";
import ProcessSteps from "@/components/marketing/ProcessSteps";
import TestimonialsGrid from "@/components/marketing/TestimonialsGrid";
import FAQSection from "@/components/marketing/FAQSection";
import ComparisonBlock from "@/components/marketing/ComparisonBlock";
import TrustStrip from "@/components/marketing/TrustStrip";
import HeroBackgroundSvg from "@/components/marketing/HeroBackgroundSvg";
import FadeInSection from "@/components/reactbits/FadeInSection";

import { BENEFITS, TESTIMONIALS } from "@/lib/marketing-data";
import {
    DISPLAY_NAME,
    PLAN_LIMITS,
    PLAN_BLURBS,
    VISIBLE_PLANS,
    AI_CHAT_MESSAGES_MONTHLY,
    AI_GENERATIONS_MONTHLY,
    DOC_PAGES_PROCESSED_MONTHLY,
} from "@/lib/plans";

/* ─── Helpers ─── */

type BillingCycle = "monthly" | "yearly";

function cn(...classes: Array<string | undefined | false | null>) {
    return classes.filter(Boolean).join(" ");
}

function fmtUSD(n: number) {
    return `$${n.toFixed(2)}`;
}

function fmtNumber(v: "Unlimited" | number | string): string {
    if (v === "Unlimited") return "Unlimited";
    if (typeof v === "number") return v.toLocaleString();
    return String(v);
}

/**
 * Icon mapping for Benefits cards.
 * Keys must match the `title` field in marketing-data.ts BENEFITS array.
 */
const BENEFIT_ICONS: Record<string, React.ElementType> = {
    "Citations First": BookOpen,
    "The Study Loop": Zap,
    "Premium Feel": Sparkles,
};

/**
 * Local copy overrides for Benefits cards.
 * Falls back to marketing-data.ts description if key not found.
 */
const BENEFIT_COPY: Record<string, string> = {
    "Citations First":
        "Every answer traces back to your document with citations — so you can study with confidence.",
    "The Study Loop":
        "Upload once. Get quizzes, flashcards, smart notes, and audio — all from the same file, all staying in sync.",
    "Premium Feel":
        "Fast, clean, and intentionally designed. Lexaro feels like a tool you actually want to open.",
};

/* ─── Page ─── */

export default function Page() {
    const [cycle, setCycle] = React.useState<BillingCycle>("monthly");

    /* Pricing data */
    const monthly = { premium: 14.99, plus: 29.99 };
    const yearly = { premium: 119.99, plus: 239.99 };
    const DISCOUNT_LABEL = "Save 19%";

    const priceFor = (plan: string) => {
        if (plan === "FREE") return { big: "Free", sub: "", badge: undefined as string | undefined };
        const base = plan === "PREMIUM" ? monthly.premium : monthly.plus;
        const yr = plan === "PREMIUM" ? yearly.premium : yearly.plus;
        return cycle === "monthly"
            ? { big: `${fmtUSD(base)}/mo`, sub: "", badge: undefined as string | undefined }
            : { big: `${fmtUSD(yr / 12)}/mo`, sub: `Billed ${fmtUSD(yr)}/yr`, badge: DISCOUNT_LABEL };
    };

    return (
        <MarketingShell>
            {/* Skip-to-content — visible only on keyboard focus */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-5 focus:py-2 focus:rounded-full focus:bg-accent focus:text-white focus:font-semibold"
            >
                Skip to content
            </a>

            <GlassNavbar />

            {/* ═══════════════════════════════════════════
                1. HERO
               ═══════════════════════════════════════════ */}
            <section id="main-content" className="relative pt-40 pb-28 overflow-hidden">
                {/* Full-bleed animated SVG background — node-graph motif + bloom gradients */}
                <HeroBackgroundSvg />

                <div className="relative mx-auto max-w-6xl px-4 md:px-6">
                    <FadeInSection className="text-center lg:text-left lg:max-w-[52%]">
                        <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/30">
                            AI-Powered Study Platform
                        </p>

                        <AccentHeading
                            as="h1"
                            className="text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.05] tracking-tight"
                        >
                            {"Study Smarter. *Graduate Stronger.*"}
                        </AccentHeading>

                        <p className="mt-6 text-white/60 mx-auto max-w-2xl text-lg lg:mx-0">
                            Stop rereading. Start mastering. Lexaro transforms any document into
                            flashcards, quizzes, AI tutoring with citations, and natural-sounding
                            audio — in minutes.
                        </p>

                        <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
                            <Link
                                href="/get-started"
                                className="rounded-full bg-white px-7 py-3 text-sm font-semibold text-black transition-all hover:opacity-90 hover:shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
                            >
                                Start Studying Free
                            </Link>
                            <Link
                                href="#process"
                                className="inline-flex items-center gap-2 rounded-full border border-white/[0.18] bg-white/[0.04] px-7 py-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/[0.08]"
                            >
                                See How It Works <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </Link>
                        </div>
                    </FadeInSection>
                </div>
            </section>

            {/* ═══════════════════════════════════════════
                2. TRUST STRIP
               ═══════════════════════════════════════════ */}
            <FadeInSection>
                <TrustStrip />
            </FadeInSection>

            {/* ═══════════════════════════════════════════
                3. PRODUCTS (Learn + Voice)
               ═══════════════════════════════════════════ */}
            <section className="border-t border-white/[0.05] py-24">
                <div className="mx-auto max-w-6xl px-4 md:px-6">
                    <FadeInSection>
                        <div className="text-center">
                            <SectionPill icon={<BookOpen className="h-3.5 w-3.5" />}>Products</SectionPill>
                            <AccentHeading as="h2" className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight">
                                {"Two Products, *One Platform*"}
                            </AccentHeading>
                            <p className="mt-4 text-white/50 max-w-2xl mx-auto">
                                Whether you prefer reading, listening, or studying interactively — Lexaro adapts to how you learn.
                            </p>
                        </div>
                    </FadeInSection>

                    <div className="mt-12 grid gap-6 lg:grid-cols-2">
                        {/* Learn */}
                        <FadeInSection delay={0.05}>
                            <GlassCard className="p-6 md:p-8 h-full">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#228CDB]/[0.06] border border-[#228CDB]/[0.14]">
                                        <BookOpen className="h-6 w-6 text-[#228CDB]/60" aria-hidden="true" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold">Lexaro Learn</h3>
                                        <p className="text-sm text-white/40">AI Study Suite</p>
                                    </div>
                                </div>
                                <p className="text-white/50 mb-6">
                                    Upload your documents and let AI help you study. Chat with citations, generate quizzes, create flashcards, and track your progress.
                                </p>
                                <ul className="space-y-3">
                                    {[
                                        "Chat with AI tutor (citations included)",
                                        "Auto-generated quizzes & flashcards",
                                        "Smart notes in multiple styles",
                                        "Essay grading with feedback",
                                        "Progress tracking & weak topic alerts",
                                    ].map((t) => (
                                        <li key={t} className="flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-white/30 flex-shrink-0" aria-hidden="true" />
                                            <span className="text-sm text-white/60">{t}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-6">
                                    <Link
                                        href="/features"
                                        className="inline-flex items-center gap-1 text-sm text-white/50 hover:text-white transition-colors"
                                    >
                                        Explore features <ArrowRight className="h-4 w-4" aria-hidden="true" />
                                    </Link>
                                </div>
                            </GlassCard>
                        </FadeInSection>

                        {/* Voice */}
                        <FadeInSection delay={0.1}>
                            <GlassCard className="p-6 md:p-8 h-full">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#228CDB]/[0.06] border border-[#228CDB]/[0.14]">
                                        <Headphones className="h-6 w-6 text-[#228CDB]/60" aria-hidden="true" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold">Lexaro Voice</h3>
                                        <p className="text-sm text-white/40">Premium Text-to-Speech</p>
                                    </div>
                                </div>
                                <p className="text-white/50 mb-6">
                                    Turn any document into natural-sounding audio. Perfect for commutes, workouts, or just when your eyes need a break.
                                </p>
                                <ul className="space-y-3">
                                    {[
                                        "Natural-sounding AI voices",
                                        "Multiple languages & accents",
                                        "Adjustable playback speed",
                                        "Download for offline listening",
                                        "Pairs with Learn for study loops",
                                    ].map((t) => (
                                        <li key={t} className="flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-white/30 flex-shrink-0" aria-hidden="true" />
                                            <span className="text-sm text-white/60">{t}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-6">
                                    <Link
                                        href="/features"
                                        className="inline-flex items-center gap-1 text-sm text-white/50 hover:text-white transition-colors"
                                    >
                                        Explore features <ArrowRight className="h-4 w-4" aria-hidden="true" />
                                    </Link>
                                </div>
                            </GlassCard>
                        </FadeInSection>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════
                4. BENEFITS (3 cards, with icons)
               ═══════════════════════════════════════════ */}
            <section className="py-24">
                <div className="mx-auto max-w-6xl px-4 md:px-6">
                    <FadeInSection>
                        <div className="text-center">
                            <SectionPill icon={<Sparkles className="h-3.5 w-3.5" />}>Benefits</SectionPill>
                            <AccentHeading as="h2" className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight">
                                {"Why Students Choose *Lexaro*"}
                            </AccentHeading>
                        </div>
                    </FadeInSection>

                    <div className="mt-12 grid gap-6 md:grid-cols-3">
                        {BENEFITS.map((b, i) => {
                            const Icon = BENEFIT_ICONS[b.title] ?? Sparkles;
                            return (
                                <FadeInSection key={b.title} delay={0.05 + i * 0.05}>
                                    <GlassCard className="p-6 h-full">
                                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#228CDB]/[0.06] border border-[#228CDB]/[0.14]">
                                            <Icon className="h-5 w-5 text-[#228CDB]/60" aria-hidden="true" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-white">{b.title}</h3>
                                        <p className="mt-3 text-sm text-white/50 leading-relaxed">
                                            {BENEFIT_COPY[b.title] ?? b.description}
                                        </p>
                                    </GlassCard>
                                </FadeInSection>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════
                5. PROCESS (How It Works — 3 steps)
               ═══════════════════════════════════════════ */}
            <section id="process" className="border-t border-white/[0.05] py-24">
                <div className="mx-auto max-w-6xl px-4 md:px-6">
                    <FadeInSection>
                        <div className="text-center">
                            <SectionPill>How It Works</SectionPill>
                            <AccentHeading as="h2" className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight">
                                {"Three Steps to *Study Better*"}
                            </AccentHeading>
                        </div>
                    </FadeInSection>

                    <div className="mt-12">
                        <FadeInSection delay={0.06}>
                            <ProcessSteps />
                        </FadeInSection>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════
                6. FEATURES GRID (3×2)
               ═══════════════════════════════════════════ */}
            <section id="features" className="border-t border-white/[0.05] py-24">
                <div className="mx-auto max-w-6xl px-4 md:px-6">
                    <FadeInSection>
                        <div className="text-center">
                            <SectionPill icon={<Zap className="h-3.5 w-3.5" />}>Features</SectionPill>
                            <AccentHeading as="h2" className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight">
                                {"Everything You Need, *In One Place*"}
                            </AccentHeading>
                        </div>
                    </FadeInSection>

                    <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {[
                            {
                                icon: MessageSquare,
                                title: "AI Tutor Chat",
                                desc: "Ask anything about your document. Get page-cited answers instantly.",
                            },
                            {
                                icon: FileText,
                                title: "Notes AI",
                                desc: "Generate outline, Cornell, or exam-prep notes from any upload — in seconds.",
                            },
                            {
                                icon: BookOpen,
                                title: "Flashcards",
                                desc: "Auto-generated decks. Focus on weak areas. Study smarter, not longer.",
                            },
                            {
                                icon: CheckCircle2,
                                title: "Quizzes & Grading",
                                desc: "Take quizzes, get instant grades, and see exactly where you went wrong.",
                            },
                            {
                                icon: Star,
                                title: "Essay Grader",
                                desc: "Rubric-based feedback with actionable rewrites and a score breakdown.",
                            },
                            {
                                icon: Headphones,
                                title: "Premium Voice",
                                desc: "Natural AI voices turn any document into a study audiobook.",
                            },
                        ].map((f, i) => {
                            const Icon = f.icon;
                            return (
                                <FadeInSection key={f.title} delay={0.04 + i * 0.03}>
                                    <GlassCard className="p-6 h-full">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#228CDB]/[0.06] border border-[#228CDB]/[0.14]">
                                                <Icon className="h-5 w-5 text-[#228CDB]/60" aria-hidden="true" />
                                            </div>
                                            <h3 className="font-semibold text-white">{f.title}</h3>
                                        </div>
                                        <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
                                    </GlassCard>
                                </FadeInSection>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════
                7. TESTIMONIALS (featured + auto-loop marquee)
               ═══════════════════════════════════════════ */}
            <section className="border-t border-white/[0.05] py-24 overflow-hidden">
                <div className="mx-auto max-w-6xl px-4 md:px-6">
                    <FadeInSection>
                        <div className="text-center">
                            <SectionPill icon={<Star className="h-3.5 w-3.5" />}>Reviews</SectionPill>
                            <AccentHeading as="h2" className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight">
                                {"Real Stories From *Real Students*"}
                            </AccentHeading>
                        </div>
                    </FadeInSection>

                    {/* Featured testimonial — static, always visible */}
                    <FadeInSection delay={0.06}>
                        <GlassCard hoverable={false} className="mt-12 p-8 text-center max-w-3xl mx-auto">
                            {/* 5-star rating */}
                            <div className="mb-6 flex justify-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className="h-4 w-4 fill-yellow-400 text-yellow-400"
                                        aria-hidden="true"
                                    />
                                ))}
                            </div>
                            <p className="font-serif italic text-xl md:text-2xl text-white/80 leading-relaxed">
                                &ldquo;{TESTIMONIALS[0].text}&rdquo;
                            </p>
                            {/* Separator */}
                            <div className="mx-auto mt-6 mb-4 h-px w-10 bg-white/[0.10]" />
                            <div className="text-sm font-semibold text-white/70">{TESTIMONIALS[0].name}</div>
                            <div className="text-xs text-white/40">{TESTIMONIALS[0].role}</div>
                        </GlassCard>
                    </FadeInSection>
                </div>

                {/* Auto-looping marquee of remaining reviews — full-width, pauses on hover */}
                <FadeInSection delay={0.1}>
                    <div className="mt-10">
                        <TestimonialsGrid loop items={TESTIMONIALS.slice(1)} />
                    </div>
                </FadeInSection>
            </section>

            {/* ═══════════════════════════════════════════
                8. PRICING TEASER
               ═══════════════════════════════════════════ */}
            <section className="py-24">
                <div className="mx-auto max-w-6xl px-4 md:px-6">
                    <FadeInSection>
                        <div className="text-center">
                            <SectionPill>Pricing</SectionPill>
                            <AccentHeading as="h2" className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight">
                                {"Simple Plans for *Everyone*"}
                            </AccentHeading>
                            <p className="mt-3 text-sm text-white/40">
                                Start free. Upgrade when you&apos;re ready.
                            </p>
                        </div>
                    </FadeInSection>

                    {/* Billing toggle */}
                    <FadeInSection delay={0.04}>
                        <div className="mt-8 flex items-center justify-center">
                            <div className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] p-1">
                                <button
                                    onClick={() => setCycle("monthly")}
                                    className={cn(
                                        "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                                        cycle === "monthly"
                                            ? "bg-white text-black"
                                            : "text-white/70 hover:text-white"
                                    )}
                                >
                                    Monthly
                                </button>
                                <div className="relative">
                                    <button
                                        onClick={() => setCycle("yearly")}
                                        className={cn(
                                            "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                                            cycle === "yearly"
                                                ? "bg-white text-black"
                                                : "text-white/70 hover:text-white"
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
                    </FadeInSection>

                    {/* Plan cards (3 columns) */}
                    <div className="mt-10 grid gap-6 lg:grid-cols-3">
                        {VISIBLE_PLANS.map((planKey, i) => {
                            const p = priceFor(planKey);
                            const isFeatured = planKey === "PREMIUM";
                            const glowClass =
                                planKey === "PREMIUM"
                                    ? "glow-blue-aqua"
                                    : planKey === "BUSINESS_PLUS"
                                    ? "glow-purple-blue"
                                    : "";
                            return (
                                <FadeInSection key={planKey} delay={0.06 + i * 0.03}>
                                    <div
                                        className={cn(
                                            "relative h-full rounded-2xl border p-6 overflow-hidden",
                                            isFeatured
                                                ? "border-white/[0.14] bg-white/[0.04]"
                                                : "border-white/[0.08] bg-transparent"
                                        )}
                                    >
                                        {glowClass && (
                                            <div
                                                className={cn("card-glow-overlay", glowClass)}
                                                aria-hidden="true"
                                            />
                                        )}
                                        <div className="relative z-10">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-lg font-semibold">
                                                    {DISPLAY_NAME[planKey]}
                                                </h3>
                                                {isFeatured && (
                                                    <span className="rounded-full border border-blue-400/25 bg-blue-500/10 px-3 py-1 text-[10px] font-semibold text-blue-300/80">
                                                        Most popular
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-1 text-sm text-white/40">
                                                {PLAN_BLURBS[planKey]}
                                            </p>

                                            <div className="mt-4 text-2xl font-semibold">{p.big}</div>
                                            {p.sub && (
                                                <div className="text-xs text-white/40 mt-1">{p.sub}</div>
                                            )}

                                            {/* Key metrics */}
                                            <div className="mt-5 space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-white/40">Chat</span>
                                                    <span className="text-white/70 font-medium">
                                                        {fmtNumber(AI_CHAT_MESSAGES_MONTHLY[planKey])}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-white/40">Generations</span>
                                                    <span className="text-white/70 font-medium">
                                                        {fmtNumber(AI_GENERATIONS_MONTHLY[planKey])}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-white/40">Pages</span>
                                                    <span className="text-white/70 font-medium">
                                                        {fmtNumber(DOC_PAGES_PROCESSED_MONTHLY[planKey])}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-white/40">Voice</span>
                                                    <span className="text-white/70 font-medium">
                                                        {PLAN_LIMITS[planKey]?.toLocaleString()} chars/mo
                                                    </span>
                                                </div>
                                            </div>

                                            <Link
                                                href={planKey === "FREE" ? "/get-started" : "/billing"}
                                                className={cn(
                                                    "mt-6 flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-opacity",
                                                    isFeatured
                                                        ? "bg-white text-black hover:opacity-90"
                                                        : "border border-white/[0.12] bg-white/[0.04] text-white/80 hover:bg-white/[0.08]"
                                                )}
                                            >
                                                {planKey === "FREE" ? "Try Free" : "Upgrade"}
                                                <ArrowRight className="h-4 w-4" aria-hidden="true" />
                                            </Link>
                                        </div>
                                    </div>
                                </FadeInSection>
                            );
                        })}
                    </div>

                    <FadeInSection delay={0.14}>
                        <div className="mt-6 text-center">
                            <Link
                                href="/plans"
                                className="inline-flex items-center gap-1 text-sm text-white/50 hover:text-white transition-colors"
                            >
                                View full comparison <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </Link>
                        </div>
                    </FadeInSection>
                </div>
            </section>

            {/* ═══════════════════════════════════════════
                9. FAQ
               ═══════════════════════════════════════════ */}
            <section id="faq" className="border-t border-white/[0.05] py-24">
                <div className="mx-auto max-w-6xl px-4 md:px-6">
                    <FadeInSection>
                        <div className="text-center mb-12">
                            <SectionPill>FAQ</SectionPill>
                            <AccentHeading as="h2" className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight">
                                {"Frequently Asked *Questions*"}
                            </AccentHeading>
                        </div>
                    </FadeInSection>

                    <FadeInSection delay={0.06}>
                        <FAQSection />
                    </FadeInSection>
                </div>
            </section>

            {/* ═══════════════════════════════════════════
                10. COMPARISON (Lexaro vs Others)
               ═══════════════════════════════════════════ */}
            <section className="border-t border-white/[0.05] py-24">
                <div className="mx-auto max-w-6xl px-4 md:px-6">
                    <FadeInSection>
                        <div className="text-center mb-12">
                            <SectionPill>Comparison</SectionPill>
                            <AccentHeading as="h2" className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight">
                                {"Lexaro vs *The Rest*"}
                            </AccentHeading>
                        </div>
                    </FadeInSection>

                    <FadeInSection delay={0.06}>
                        <ComparisonBlock />
                    </FadeInSection>
                </div>
            </section>

            {/* ═══════════════════════════════════════════
                11. CTA + FOOTER
               ═══════════════════════════════════════════ */}
            <CTASection />
            <MarketingFooter />
        </MarketingShell>
    );
}
