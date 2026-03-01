"use client";

import React from "react";
import Link from "next/link";
import {
    ArrowRight,
    BookOpen,
    Volume2,
    Timer,
    ShieldCheck,
    Sparkles,
    MessageSquare,
    FileText,
    CheckCircle2,
    LayoutGrid,
    TrendingUp,
    Calendar,
    PenTool,
} from "lucide-react";

import MarketingShell from "@/components/marketing/MarketingShell";
import GlassNavbar from "@/components/marketing/GlassNavbar";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import SectionPill from "@/components/marketing/SectionPill";
import AccentHeading from "@/components/marketing/AccentHeading";
import GlassCard from "@/components/marketing/GlassCard";
import CTASection from "@/components/marketing/CTASection";
import FadeInSection from "@/components/reactbits/FadeInSection";

import VoicesShowcase from "@/components/VoicesShowcase";

/** Feature definition used in the Learn grid */
type Feature = { icon: React.ReactNode; title: string; desc: string };

const LEARN_FEATURES: Feature[] = [
    { icon: <MessageSquare className="h-5 w-5" />, title: "Study Copilot", desc: "Ask while you read. Answers include citations so you can verify instantly." },
    { icon: <FileText className="h-5 w-5" />, title: "Notes Generator", desc: "Turn a chapter into clean, structured notes with one click." },
    { icon: <LayoutGrid className="h-5 w-5" />, title: "Flashcards", desc: "Create decks from your material and drill what matters." },
    { icon: <CheckCircle2 className="h-5 w-5" />, title: "Quizzes", desc: "Generate quizzes by difficulty and get feedback that helps you improve." },
    { icon: <TrendingUp className="h-5 w-5" />, title: "Progress Hub", desc: "Track attempts, accuracy, weak areas, and what to review next." },
    { icon: <Calendar className="h-5 w-5" />, title: "Study Calendar", desc: "A study plan with daily tasks based on your exam date and availability." },
    { icon: <PenTool className="h-5 w-5" />, title: "Essay Grader", desc: "Get structured feedback: strengths, weaknesses, and specific improvements." },
];

const VOICE_BENEFITS: { icon: React.ReactNode; title: string; desc: string }[] = [
    { icon: <Volume2 className="h-5 w-5" />, title: "Study Anywhere", desc: "Turn chapters into audio and keep moving — walking, commuting, or cleaning up." },
    { icon: <Timer className="h-5 w-5" />, title: "Speed Control", desc: "Review faster by increasing playback speed — great for revision sessions." },
    { icon: <ShieldCheck className="h-5 w-5" />, title: "Clean and Simple", desc: "Pick a voice, hit play, and focus — no setup or messy UI." },
];

export default function FeaturesPage() {
    return (
        <MarketingShell>
            <GlassNavbar />

            {/* Hero */}
            <section className="pt-28 pb-12">
                <div className="mx-auto max-w-6xl px-4 md:px-6">
                    <FadeInSection>
                        <div className="text-center">
                            <SectionPill icon={<Sparkles className="h-3.5 w-3.5" />}>Features</SectionPill>
                            <AccentHeading as="h1" className="mt-5 text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight">
                                {"One Place to Read, Practice, and *Improve*"}
                            </AccentHeading>
                            <p className="mt-5 text-white/60 max-w-2xl mx-auto text-lg">
                                Lexaro brings your documents, study tools, and voice into a single workflow — built to feel premium, clean, and reliable.
                            </p>
                        </div>

                        <div className="mt-8 flex flex-wrap justify-center gap-3">
                            <Link href="/get-started" className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90">
                                Get Started
                            </Link>
                            <Link href="/plans" className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-5 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/[0.08]">
                                See Pricing <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </FadeInSection>

                    {/* Mini stats */}
                    <FadeInSection delay={0.08}>
                        <div className="mt-10 grid gap-4 md:grid-cols-3">
                            {[
                                { icon: <Timer className="h-4 w-4" />, title: "Fast workflow", desc: "Upload → ask → practice." },
                                { icon: <ShieldCheck className="h-4 w-4" />, title: "Citations", desc: "Jump to the exact page." },
                                { icon: <Sparkles className="h-4 w-4" />, title: "Better retention", desc: "Quizzes + flashcards built in." },
                            ].map((s) => (
                                <GlassCard key={s.title} className="p-4">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08]">
                                            {s.icon}
                                        </div>
                                        <div className="font-semibold text-sm">{s.title}</div>
                                    </div>
                                    <p className="mt-2 text-sm text-white/50">{s.desc}</p>
                                </GlassCard>
                            ))}
                        </div>
                    </FadeInSection>
                </div>
            </section>

            {/* Lexaro Learn */}
            <section className="py-20">
                <div className="mx-auto max-w-6xl px-4 md:px-6">
                    <FadeInSection>
                        <SectionPill icon={<BookOpen className="h-3.5 w-3.5" />}>Lexaro Learn</SectionPill>
                        <AccentHeading as="h2" className="mt-4 text-3xl md:text-4xl font-semibold">
                            {"Study Tools Built Around *Your Documents*"}
                        </AccentHeading>
                        <p className="mt-3 text-white/60 max-w-2xl">
                            Ask questions with citations, then generate practice that reinforces what you missed.
                        </p>
                    </FadeInSection>

                    <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {LEARN_FEATURES.map((f, i) => (
                            <FadeInSection key={f.title} delay={0.04 + i * 0.04}>
                                <GlassCard className="p-5 h-full">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08]">
                                            <span className="text-white/50">{f.icon}</span>
                                        </div>
                                        <h3 className="font-semibold">{f.title}</h3>
                                    </div>
                                    <p className="mt-3 text-sm text-white/50">{f.desc}</p>
                                </GlassCard>
                            </FadeInSection>
                        ))}
                    </div>

                    {/* "Premium loop" card */}
                    <FadeInSection delay={0.3}>
                        <GlassCard hoverable={false} className="mt-8 p-6 md:p-8">
                            <h3 className="text-lg font-semibold">A premium loop</h3>
                            <p className="mt-2 text-white/60">
                                The experience is designed around an "attempt, grade, improve" loop — so you're never guessing what to do next.
                            </p>
                            <div className="mt-6 grid gap-3 md:grid-cols-3">
                                {[
                                    { title: "Citations included", desc: "Every answer points back to your pages." },
                                    { title: "Fast practice", desc: "Generate quizzes/flashcards instantly." },
                                    { title: "Works on real PDFs", desc: "OCR + extraction for scanned pages." },
                                ].map((p) => (
                                    <div key={p.title} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                                        <div className="font-medium text-sm">{p.title}</div>
                                        <p className="mt-1 text-xs text-white/50">{p.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    </FadeInSection>
                </div>
            </section>

            {/* Lexaro Voice */}
            <section className="py-20">
                <div className="mx-auto max-w-6xl px-4 md:px-6">
                    <FadeInSection>
                        <SectionPill icon={<Volume2 className="h-3.5 w-3.5" />}>Lexaro Voice</SectionPill>
                        <AccentHeading as="h2" className="mt-4 text-3xl md:text-4xl font-semibold">
                            {"Listen to Your Material With *Premium Voices*"}
                        </AccentHeading>
                        <p className="mt-3 text-white/60 max-w-2xl">
                            Perfect for studying on the go, reading support, and fast review.
                        </p>
                    </FadeInSection>

                    <div className="mt-10 grid gap-6 lg:grid-cols-12">
                        {/* Voice gallery */}
                        <div className="lg:col-span-7">
                            <FadeInSection delay={0.08}>
                                <GlassCard hoverable={false} className="p-6">
                                    <div className="flex items-center justify-between mb-5">
                                        <span className="text-sm font-semibold">Voice Gallery</span>
                                        <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-white/50">
                                            Preview included
                                        </span>
                                    </div>
                                    <VoicesShowcase />
                                </GlassCard>
                            </FadeInSection>
                        </div>

                        {/* Voice benefits */}
                        <div className="lg:col-span-5 space-y-4">
                            {VOICE_BENEFITS.map((b, i) => (
                                <FadeInSection key={b.title} delay={0.12 + i * 0.04}>
                                    <GlassCard className="p-5">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08]">
                                                <span className="text-white/50">{b.icon}</span>
                                            </div>
                                            <h3 className="font-semibold">{b.title}</h3>
                                        </div>
                                        <p className="mt-3 text-sm text-white/50">{b.desc}</p>
                                    </GlassCard>
                                </FadeInSection>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <CTASection />
            <MarketingFooter />
        </MarketingShell>
    );
}
