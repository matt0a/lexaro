"use client";

import React from "react";
import Link from "next/link";
import { Quote, BookOpen, Mic2, ArrowRight, CheckCircle2 } from "lucide-react";

import MarketingShell from "@/components/marketing/MarketingShell";
import GlassNavbar from "@/components/marketing/GlassNavbar";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import SectionPill from "@/components/marketing/SectionPill";
import AccentHeading from "@/components/marketing/AccentHeading";
import GlassCard from "@/components/marketing/GlassCard";
import CTASection from "@/components/marketing/CTASection";
import FadeInSection from "@/components/reactbits/FadeInSection";

export default function AboutPage() {
    return (
        <MarketingShell>
            <GlassNavbar />

            {/* Hero */}
            <section className="pt-28 pb-12">
                <div className="mx-auto max-w-6xl px-4 md:px-6">
                    <FadeInSection>
                        <div className="text-center">
                            <SectionPill>About</SectionPill>
                            <AccentHeading as="h1" className="mt-5 text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight">
                                {"Built to Make Studying Feel *Premium*"}
                            </AccentHeading>
                            <p className="mt-5 text-white/60 max-w-2xl mx-auto text-lg">
                                Lexaro combines AI-powered study tools with natural voice, designed around one goal: make progress obvious and studying less painful.
                            </p>
                        </div>
                    </FadeInSection>
                </div>
            </section>

            {/* Our Story */}
            <section className="py-20">
                <div className="mx-auto max-w-6xl px-4 md:px-6">
                    <FadeInSection>
                        <div className="grid gap-12 lg:grid-cols-2 items-center">
                            <div>
                                <SectionPill>Our Story</SectionPill>
                                <h2 className="mt-4 text-3xl md:text-4xl font-semibold leading-tight">
                                    Started by students, for students.
                                </h2>
                                <p className="mt-5 text-white/60">
                                    We got tired of jumping between apps, losing track of what we'd reviewed, and never knowing if we were actually making progress. So we built something better.
                                </p>
                                <p className="mt-4 text-white/60">
                                    Lexaro brings everything into one place: your documents, AI study tools, voice reading, and a clear view of what you've learned and what still needs work.
                                </p>
                            </div>

                            <GlassCard hoverable={false} className="p-6">
                                <Quote className="h-8 w-8 text-white/30 mb-4" />
                                <p className="text-lg text-white/80 font-serif italic">
                                    "We wanted a tool that felt as good as the best apps we use daily — but built specifically for studying."
                                </p>
                                <p className="mt-4 text-sm text-white/50">— The Lexaro Team</p>
                            </GlassCard>
                        </div>
                    </FadeInSection>
                </div>
            </section>

            {/* Values */}
            <section className="py-20">
                <div className="mx-auto max-w-6xl px-4 md:px-6">
                    <FadeInSection>
                        <div className="text-center">
                            <SectionPill>Our Values</SectionPill>
                            <AccentHeading as="h2" className="mt-4 text-3xl md:text-4xl font-semibold">
                                {"What We *Believe* In"}
                            </AccentHeading>
                        </div>
                    </FadeInSection>

                    <div className="mt-12 grid gap-6 md:grid-cols-2">
                        {[
                            { title: "Citations first", desc: "Every answer points back to your materials so you can verify and trust the output. No hallucinations, no guessing." },
                            { title: "The study loop", desc: "Attempt, grade, improve. Our tools are designed around this cycle so you're never guessing what to do next." },
                            { title: "Premium feel", desc: "Clean UI, consistent outputs, and a focus on making progress visible. Studying should feel good." },
                            { title: "Built for real students", desc: "From PDFs to exams, Lexaro handles the formats and workflows students actually use. No fluff, just results." },
                        ].map((v, i) => (
                            <FadeInSection key={v.title} delay={0.05 + i * 0.05}>
                                <GlassCard className="p-6">
                                    <h3 className="text-lg font-semibold text-white">{v.title}</h3>
                                    <p className="mt-3 text-white/60">{v.desc}</p>
                                </GlassCard>
                            </FadeInSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* Products */}
            <section className="py-20">
                <div className="mx-auto max-w-6xl px-4 md:px-6">
                    <FadeInSection>
                        <div className="text-center">
                            <SectionPill>Products</SectionPill>
                            <AccentHeading as="h2" className="mt-4 text-3xl md:text-4xl font-semibold">
                                {"Two Products, *One Workflow*"}
                            </AccentHeading>
                            <p className="mt-4 text-white/60 max-w-2xl mx-auto">
                                Whether you prefer reading or listening, Lexaro has you covered.
                            </p>
                        </div>
                    </FadeInSection>

                    <div className="mt-12 grid gap-6 lg:grid-cols-2">
                        <FadeInSection delay={0.05}>
                            <GlassCard hoverable={false} className="p-6 md:p-8 h-full">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08]">
                                        <BookOpen className="h-6 w-6 text-white/50" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold">Lexaro Learn</h3>
                                        <p className="text-sm text-white/50">AI Study Suite</p>
                                    </div>
                                </div>
                                <p className="text-white/60 mb-6">
                                    Upload your documents and let AI help you study. Chat with citations, generate quizzes, create flashcards, and track your progress.
                                </p>
                                <ul className="space-y-3">
                                    {["Chat with AI tutor (citations included)", "Auto-generated quizzes & flashcards", "Smart notes in multiple styles", "Essay grading with feedback", "Progress tracking & weak topic alerts"].map((t) => (
                                        <li key={t} className="flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-white/40 flex-shrink-0" />
                                            <span className="text-sm text-white/70">{t}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-6">
                                    <Link href="/features" className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-white transition-colors">
                                        Learn more <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            </GlassCard>
                        </FadeInSection>

                        <FadeInSection delay={0.1}>
                            <GlassCard hoverable={false} className="p-6 md:p-8 h-full">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08]">
                                        <Mic2 className="h-6 w-6 text-white/50" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold">Lexaro Voice</h3>
                                        <p className="text-sm text-white/50">Premium Text-to-Speech</p>
                                    </div>
                                </div>
                                <p className="text-white/60 mb-6">
                                    Turn any document into natural-sounding audio. Perfect for commutes, workouts, or just when your eyes need a break.
                                </p>
                                <ul className="space-y-3">
                                    {["Natural-sounding AI voices", "Multiple languages & accents", "Adjustable playback speed", "Download for offline listening", "Read-along mode with highlights"].map((t) => (
                                        <li key={t} className="flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-white/40 flex-shrink-0" />
                                            <span className="text-sm text-white/70">{t}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-6">
                                    <Link href="/features" className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-white transition-colors">
                                        Learn more <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            </GlassCard>
                        </FadeInSection>
                    </div>
                </div>
            </section>

            <CTASection />
            <MarketingFooter />
        </MarketingShell>
    );
}
