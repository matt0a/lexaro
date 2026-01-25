"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Quote, Upload, Zap } from "lucide-react";

import FloatingLines from "@/components/reactbits/FloatingLines";
import StarBorderCard from "@/components/reactbits/StarBorderCard";
import ShimmerButton from "@/components/reactbits/ShimmerButton";
import FadeInSection from "@/components/reactbits/FadeInSection";
import WordPullUp from "@/components/reactbits/WordPullUp";

function Pill({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/75">
      {icon}
            {text}
    </span>
    );
}

export default function PremiumHero() {
    return (
        <section className="relative min-h-[92vh] overflow-hidden flex items-center">
            {/* Shader background */}
            <div className="absolute inset-0">
                <FloatingLines
                    linesGradient={["#2f4ba2", "#e947f5", "#00d4ff"]}
                    enabledWaves={["top", "middle", "bottom"]}
                    lineCount={[6, 10, 6]}
                    lineDistance={[6, 5, 6]}
                    animationSpeed={1}
                    interactive
                    parallax
                    parallaxStrength={0.22}
                    mixBlendMode="screen"
                    opacity={0.95}
                />
                {/* premium overlay */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-black/20 to-black/55" />
                <div className="pointer-events-none absolute -top-40 left-1/2 h-[680px] w-[1100px] -translate-x-1/2 rounded-full bg-sky-500/10 blur-3xl" />
                <div className="pointer-events-none absolute top-24 left-[10%] h-[520px] w-[520px] rounded-full bg-fuchsia-500/10 blur-3xl" />
            </div>

            <div className="relative z-10 mx-auto max-w-6xl px-4 md:px-6 pt-20 pb-10 w-full">
                <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
                    {/* Left copy */}
                    <div>
                        <FadeInSection>
                            <p className="text-xs tracking-[0.25em] text-white/60 uppercase">
                                Study • Listen • Improve
                            </p>
                        </FadeInSection>

                        <FadeInSection delay={0.06}>
                            <WordPullUp
                                text="Turn your PDFs into a premium study coach."
                                className="mt-4 text-4xl md:text-6xl font-semibold leading-tight"
                                delay={0.05}
                            />
                        </FadeInSection>

                        <FadeInSection delay={0.1}>
                            <p className="mt-6 text-white/80 text-lg max-w-xl">
                                Upload a document, ask questions with{" "}
                                <span className="text-white font-semibold">page citations</span>, then generate
                                quizzes and flashcards that adapt to your weak spots.
                            </p>
                        </FadeInSection>

                        <FadeInSection delay={0.14}>
                            <div className="mt-6 flex flex-wrap gap-2">
                                <Pill icon={<Upload className="h-4 w-4" />} text="Upload PDFs & notes" />
                                <Pill icon={<Quote className="h-4 w-4" />} text="Answers with sources" />
                                <Pill icon={<Zap className="h-4 w-4" />} text="Attempt → grade → improve" />
                                <Pill icon={<Sparkles className="h-4 w-4" />} text="Quizzes + flashcards" />
                            </div>
                        </FadeInSection>

                        <FadeInSection delay={0.18}>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <ShimmerButton href="/get-started" variant="primary">
                                    Try it free
                                </ShimmerButton>

                                <ShimmerButton href="/plans" variant="ghost">
                                    See pricing <ArrowRight className="h-4 w-4" />
                                </ShimmerButton>
                            </div>

                            <p className="mt-4 text-xs text-white/55">
                                Free is intentionally limited so you can test it. Premium feels unlimited for
                                normal use.
                            </p>
                        </FadeInSection>

                        {/* Tiny trust row */}
                        <FadeInSection delay={0.22}>
                            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-white/55">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  No credit card required
                </span>
                                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  Works for school & exams
                </span>
                            </div>
                        </FadeInSection>
                    </div>

                    {/* Right preview */}
                    <div className="hidden lg:block">
                        <FadeInSection delay={0.12}>
                            <StarBorderCard>
                                <div className="p-7">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm font-semibold">Live preview</div>
                                        <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-white/70">
                      Citations + practice
                    </span>
                                    </div>

                                    <div className="mt-5 space-y-3">
                                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                            <div className="text-xs text-white/60">You</div>
                                            <div className="mt-1 text-sm text-white/90">
                                                Explain this page simply, then quiz me.
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                            <div className="text-xs text-white/60">Lexaro</div>
                                            <div className="mt-1 text-sm text-white/90">
                                                Here’s the simple explanation. Next, a 5-question quiz and flashcards.
                                            </div>

                                            <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-white/70">
                          Notes · page 3
                        </span>
                                                <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-white/70">
                          Textbook · page 12
                        </span>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                            <div className="text-xs text-white/60">Quick quiz</div>
                                            <div className="mt-1 text-sm text-white/90">
                                                1) Define ATP. 2) What creates the gradient? 3) What’s the key enzyme?
                                            </div>
                                        </div>

                                        <div className="mt-5 flex items-center justify-between">
                                            <Link href="/get-started" className="text-sm text-white/85 hover:text-white">
                                                Start a session →
                                            </Link>
                                            <span className="text-xs text-white/55">~30s per answer</span>
                                        </div>
                                    </div>
                                </div>
                            </StarBorderCard>
                        </FadeInSection>
                    </div>
                </div>
            </div>
        </section>
    );
}
