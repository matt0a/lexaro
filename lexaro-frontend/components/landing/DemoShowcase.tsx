"use client";

import React from "react";
import { Play, TrendingUp, CheckCircle2, ArrowRight } from "lucide-react";

import StarBorderCard from "@/components/reactbits/StarBorderCard";
import GlareHoverCard from "@/components/reactbits/GlareHoverCard";
import FadeInSection from "@/components/reactbits/FadeInSection";
import ShimmerButton from "@/components/reactbits/ShimmerButton";

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
        <div>
            <p className="text-xs tracking-[0.25em] text-white/60 uppercase">{kicker}</p>
            <h2 className="mt-2 text-3xl md:text-4xl font-semibold">{title}</h2>
            <p className="mt-3 text-white/70 max-w-2xl">{subtitle}</p>
        </div>
    );
}

function Sparkline() {
    // simple inline SVG "chart" that feels premium without bringing in chart libs
    return (
        <svg viewBox="0 0 200 60" className="w-full h-12 opacity-80">
            <path
                d="M0,45 C25,35 35,55 55,40 C75,25 85,50 110,30 C135,10 150,30 170,18 C185,10 192,18 200,12"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
            />
        </svg>
    );
}

function VideoPlaceholder({ label }: { label: string }) {
    return (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/55">
            <div className="aspect-video w-full grid place-items-center">
                <div className="flex flex-col items-center gap-2">
                    <div className="h-14 w-14 rounded-2xl border border-white/15 bg-white/5 grid place-items-center">
                        <Play className="h-6 w-6 text-white/80" />
                    </div>
                    <div className="text-sm text-white/80">{label}</div>
                    <div className="text-xs text-white/50">(video placeholder)</div>
                </div>
            </div>

            {/* subtle sheen */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-40" />
        </div>
    );
}

export default function DemoShowcase() {
    return (
        <section className="relative overflow-hidden">
            {/* background blooms */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/2 top-10 h-[520px] w-[980px] -translate-x-1/2 rounded-full bg-sky-500/10 blur-3xl" />
                <div className="absolute left-1/3 top-44 h-[420px] w-[840px] -translate-x-1/2 rounded-full bg-fuchsia-500/10 blur-3xl" />
            </div>

            <div className="relative z-10 mx-auto max-w-6xl px-4 md:px-6 py-20">
                <FadeInSection>
                    <Header
                        kicker="Preview"
                        title="See the loop: attempt → grade → improve"
                        subtitle="A premium flow that feels like a real exam platform: quick practice, instant feedback, and clear next steps."
                    />
                </FadeInSection>

                <div className="mt-10 grid gap-6 lg:grid-cols-12">
                    {/* left: demo videos */}
                    <div className="lg:col-span-7 space-y-6">
                        <FadeInSection delay={0.06}>
                            <StarBorderCard>
                                <div className="p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm font-semibold">Product demo</div>
                                        <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-white/70">
                      Placeholder
                    </span>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <VideoPlaceholder label="Chat with citations" />
                                        <VideoPlaceholder label="Quiz + grading" />
                                    </div>
                                </div>
                            </StarBorderCard>
                        </FadeInSection>

                        <FadeInSection delay={0.1}>
                            <GlareHoverCard className="bg-gradient-to-b from-sky-500/12 to-white/5">
                                <div className="p-6">
                                    <div className="flex items-center gap-2 text-white/85">
                                        <TrendingUp className="h-5 w-5" />
                                        <div className="font-semibold">Progress that feels instant</div>
                                    </div>
                                    <p className="mt-2 text-white/70">
                                        Every attempt updates your accuracy and weak topics — so the next study action is obvious.
                                    </p>
                                </div>
                            </GlareHoverCard>
                        </FadeInSection>
                    </div>

                    {/* right: analytics / grade cards */}
                    <div className="lg:col-span-5 space-y-6">
                        <FadeInSection delay={0.12}>
                            <StarBorderCard>
                                <div className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm font-semibold">Mock analytics</div>
                                        <span className="text-xs text-white/55">last 7 days</span>
                                    </div>

                                    <div className="mt-4 grid grid-cols-3 gap-3">
                                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                            <div className="text-[11px] uppercase tracking-wider text-white/55">Accuracy</div>
                                            <div className="mt-1 text-lg font-semibold">78%</div>
                                        </div>
                                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                            <div className="text-[11px] uppercase tracking-wider text-white/55">Streak</div>
                                            <div className="mt-1 text-lg font-semibold">5 days</div>
                                        </div>
                                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                            <div className="text-[11px] uppercase tracking-wider text-white/55">Time</div>
                                            <div className="mt-1 text-lg font-semibold">2h 10m</div>
                                        </div>
                                    </div>

                                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-white/70">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm font-semibold text-white/85">Trend</div>
                                            <div className="text-xs text-white/55">improving</div>
                                        </div>
                                        <div className="mt-2 text-white/60">
                                            <Sparkline />
                                        </div>
                                    </div>
                                </div>
                            </StarBorderCard>
                        </FadeInSection>

                        <FadeInSection delay={0.16}>
                            <GlareHoverCard className="bg-gradient-to-b from-violet-500/12 to-white/5">
                                <div className="p-6">
                                    <div className="flex items-center gap-2 text-white/85">
                                        <CheckCircle2 className="h-5 w-5" />
                                        <div className="font-semibold">“Official” results format</div>
                                    </div>

                                    <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/75">
                                        <div className="flex items-center justify-between">
                                            <span className="text-white/85 font-semibold">Quiz attempt</span>
                                            <span className="text-white/60">Score: 4/5</span>
                                        </div>
                                        <div className="mt-2 text-white/65">
                                            Next steps: review pages 12–14 → retake (hard) → generate flashcards.
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <ShimmerButton href="/get-started" variant="primary" className="w-full justify-center">
                                            Try it free <ArrowRight className="h-4 w-4" />
                                        </ShimmerButton>
                                    </div>
                                </div>
                            </GlareHoverCard>
                        </FadeInSection>
                    </div>
                </div>
            </div>
        </section>
    );
}
