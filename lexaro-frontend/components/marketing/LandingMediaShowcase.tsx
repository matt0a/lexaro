"use client";

import React from "react";
import { motion } from "framer-motion";
import StarBorderCard from "@/components/reactbits/StarBorderCard";
import GlareHoverCard from "@/components/reactbits/GlareHoverCard";
import ShimmerButton from "@/components/reactbits/ShimmerButton";
import { Play, ArrowRight, Sparkles, Quote, Volume2 } from "lucide-react";

function cn(...classes: Array<string | undefined | false | null>) {
    return classes.filter(Boolean).join(" ");
}

/**
 * Premium landing “media showcase” section:
 * - Big “device” preview (placeholder video area)
 * - 3 mini preview cards
 * - 2 small “stat/chart” cards for that premium SaaS feel
 *
 * Later: swap the placeholder div inside <DevicePreview/> to <video .../>
 */
export default function LandingMediaShowcase() {
    return (
        <section className="relative overflow-hidden">
            {/* subtle glow */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/2 top-10 h-[520px] w-[980px] -translate-x-1/2 rounded-full bg-sky-500/10 blur-3xl" />
                <div className="absolute left-1/3 top-44 h-[420px] w-[840px] -translate-x-1/2 rounded-full bg-fuchsia-500/10 blur-3xl" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/35" />
            </div>

            <div className="relative z-10 mx-auto max-w-6xl px-4 md:px-6 py-16 md:py-20">
                <Header
                    kicker="Preview"
                    title="A premium study workflow — in one place"
                    subtitle="This is the part that makes it feel “real”: smooth previews, clear outputs, and an instant practice loop."
                />

                <div className="mt-10 grid gap-6 lg:grid-cols-12">
                    {/* Left: device preview */}
                    <div className="lg:col-span-7">
                        <FadeIn delay={0.05}>
                            <StarBorderCard alwaysAnimate speed={18}>
                                <div className="p-4 md:p-5">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm font-semibold">Product preview</div>
                                        <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-white/70">
                      Video placeholder
                    </span>
                                    </div>

                                    <div className="mt-4">
                                        <DevicePreview />
                                    </div>

                                    <div className="mt-5 flex flex-wrap gap-3">
                                        <ShimmerButton href="/get-started" variant="primary">
                                            Try it free
                                        </ShimmerButton>
                                        <ShimmerButton href="/about/features" variant="ghost">
                                            See features <ArrowRight className="h-4 w-4" />
                                        </ShimmerButton>
                                    </div>

                                    <p className="mt-3 text-xs text-white/55">
                                        We’ll replace placeholders with real screen recordings later.
                                    </p>
                                </div>
                            </StarBorderCard>
                        </FadeIn>
                    </div>

                    {/* Right: stacked previews + stats */}
                    <div className="lg:col-span-5 space-y-6">
                        <FadeIn delay={0.1}>
                            <StarBorderCard>
                                <div className="p-5">
                                    <MiniPreview
                                        icon={<Quote className="h-4 w-4" />}
                                        title="Ask with citations"
                                        desc="Answers link back to the exact page so users can verify instantly."
                                        tone="violet"
                                    />
                                </div>
                            </StarBorderCard>
                        </FadeIn>

                        <FadeIn delay={0.14}>
                            <StarBorderCard>
                                <div className="p-5">
                                    <MiniPreview
                                        icon={<Sparkles className="h-4 w-4" />}
                                        title="Generate practice"
                                        desc="Notes, flashcards, quizzes — clean output, one click."
                                        tone="sky"
                                    />
                                </div>
                            </StarBorderCard>
                        </FadeIn>

                        <FadeIn delay={0.18}>
                            <StarBorderCard>
                                <div className="p-5">
                                    <MiniPreview
                                        icon={<Volume2 className="h-4 w-4" />}
                                        title="Listen immediately"
                                        desc="Voice previews + read-aloud for study, accessibility, and speed."
                                        tone="cyan"
                                    />
                                </div>
                            </StarBorderCard>
                        </FadeIn>

                        {/* Stats row */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FadeIn delay={0.22}>
                                <StatCard
                                    label="Practice accuracy"
                                    value="86%"
                                    hint="Example metric (placeholder)"
                                />
                            </FadeIn>
                            <FadeIn delay={0.26}>
                                <MiniChartCard />
                            </FadeIn>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* -----------------------------
   Subcomponents
------------------------------ */

function Header({
                    kicker,
                    title,
                    subtitle,
                }: {
    kicker: string;
    title: string;
    subtitle: string;
}) {
    return (
        <div className="text-center">
            <p className="text-xs tracking-[0.25em] text-white/60 uppercase">{kicker}</p>
            <h2 className="mt-2 text-3xl md:text-4xl font-semibold">{title}</h2>
            <p className="mt-3 text-white/70 max-w-3xl mx-auto">{subtitle}</p>
        </div>
    );
}

function FadeIn({
                    children,
                    delay = 0,
                }: {
    children: React.ReactNode;
    delay?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay }}
            viewport={{ once: true, amount: 0.25 }}
        >
            {children}
        </motion.div>
    );
}

function DevicePreview() {
    return (
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/55 backdrop-blur-md shadow-[0_30px_120px_rgba(0,0,0,.75)]">
            {/* top bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/60">
                <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                </div>
                <div className="text-[11px] text-white/55">Lexaro Learn • Demo</div>
            </div>

            {/* “screen” */}
            <div className="p-4">
                <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-black/40">
                    {/* Placeholder “video” content */}
                    <div className="absolute inset-0">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,.18),transparent_55%),radial-gradient(circle_at_70%_60%,rgba(217,70,239,.18),transparent_55%)]" />
                        <div className="absolute inset-0 opacity-50 bg-[linear-gradient(to_bottom,rgba(255,255,255,.06),transparent_30%,rgba(0,0,0,.35))]" />
                    </div>

                    {/* “UI overlay” */}
                    <div className="relative h-full w-full p-4 md:p-5">
                        <div className="flex items-center justify-between">
              <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[11px] text-white/70">
                Doc viewer
              </span>
                            <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[11px] text-white/70">
                Chat + Practice
              </span>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                <div className="text-xs text-white/60">Your PDF</div>
                                <div className="mt-2 h-24 rounded-xl border border-white/10 bg-black/40" />
                                <div className="mt-3 flex gap-2">
                                    <span className="h-2 w-16 rounded-full bg-white/15" />
                                    <span className="h-2 w-10 rounded-full bg-white/10" />
                                </div>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                <div className="text-xs text-white/60">Lexaro</div>
                                <div className="mt-2 text-sm text-white/90">
                                    Here’s the simple explanation + a quick quiz.
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[11px] text-white/70">
                    Source • p12
                  </span>
                                    <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[11px] text-white/70">
                    Quiz • 5Q
                  </span>
                                </div>
                            </div>
                        </div>

                        {/* Play button */}
                        <button
                            type="button"
                            className="group absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                            aria-label="Play preview (placeholder)"
                        >
                            <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/55 px-4 py-3 backdrop-blur-md shadow-[0_20px_70px_rgba(0,0,0,.7)] transition group-hover:bg-black/70">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 border border-white/15">
                  <Play className="h-4 w-4 text-white/90" />
                </span>
                                <span className="text-sm font-semibold text-white/90">
                  Watch preview
                </span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MiniPreview({
                         icon,
                         title,
                         desc,
                         tone,
                     }: {
    icon: React.ReactNode;
    title: string;
    desc: string;
    tone: "sky" | "violet" | "cyan";
}) {
    const toneClass =
        tone === "sky"
            ? "from-sky-500/12 to-white/5"
            : tone === "violet"
                ? "from-violet-500/12 to-white/5"
                : "from-cyan-400/12 to-white/5";

    return (
        <GlareHoverCard className={cn("bg-gradient-to-b", toneClass)}>
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                    {icon}
                </div>
                <div className="text-lg font-semibold">{title}</div>
            </div>
            <p className="mt-2 text-white/70">{desc}</p>

            <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-white/70">
          Clean output
        </span>
                <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-white/70">
          Fast loop
        </span>
            </div>
        </GlareHoverCard>
    );
}

function StatCard({
                      label,
                      value,
                      hint,
                  }: {
    label: string;
    value: string;
    hint?: string;
}) {
    return (
        <div className="rounded-3xl border border-white/10 bg-black/55 backdrop-blur-md p-5 shadow-[0_24px_90px_rgba(0,0,0,.7)]">
            <div className="text-xs uppercase tracking-wider text-white/55">
                {label}
            </div>

            <div className="mt-2 text-3xl font-semibold">{value}</div>

            {hint ? <div className="mt-1 text-xs text-white/50">{hint}</div> : null}

            <div className="mt-4">
                <ProgressBar value={86} />
            </div>
        </div>
    );
}

function ProgressBar({ value }: { value: number }) {
    const v = Math.max(0, Math.min(100, value));
    return (
        <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <motion.div
                initial={{ width: "0%" }}
                whileInView={{ width: `${v}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                viewport={{ once: true }}
                className="h-full bg-white/50"
            />
        </div>
    );
}

function MiniChartCard() {
    // Simple SVG sparkline (no extra deps)
    const points = "0,26 10,22 20,24 30,16 40,18 50,12 60,14 70,9 80,10 90,6 100,8";
    return (
        <div className="rounded-3xl border border-white/10 bg-black/55 backdrop-blur-md p-5 shadow-[0_24px_90px_rgba(0,0,0,.7)]">
            <div className="text-xs uppercase tracking-wider text-white/55">
                Study streak
            </div>

            <div className="mt-2 flex items-end justify-between gap-3">
                <div>
                    <div className="text-3xl font-semibold">12</div>
                    <div className="text-xs text-white/50">days</div>
                </div>

                <svg viewBox="0 0 100 30" className="h-10 w-32">
                    <polyline
                        points={points}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-white/55"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                    />
                </svg>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-white/70">
          Progress hub
        </span>
                <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-white/70">
          Next steps
        </span>
            </div>
        </div>
    );
}
