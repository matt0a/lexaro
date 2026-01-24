// app/about/features/page.tsx
"use client";

import React from "react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import FadeInSection from "@/components/reactbits/FadeInSection";
import FloatingLinesBackground from "@/components/reactbits/FloatingLinesBackground";
import FluidGlassSection from "@/components/reactbits/FluidGlassSection";
import StarBorderCard from "@/components/reactbits/StarBorderCard";
import ShimmerButton from "@/components/reactbits/ShimmerButton";

import {
    BookOpen,
    Quote,
    Sparkles,
    LayoutList,
    CalendarDays,
    GraduationCap,
    FileText,
    ScanText,
    Volume2,
    Languages,
    Download,
    Zap,
} from "lucide-react";

type Feature = {
    icon: React.ReactNode;
    title: string;
    desc: string;
};

const LEARN_FEATURES: Feature[] = [
    {
        icon: <Quote className="h-5 w-5" />,
        title: "AI Tutor (Study Copilot) + citations",
        desc: "Ask questions while you read. Answers include page-linked sources so you can verify fast.",
    },
    {
        icon: <LayoutList className="h-5 w-5" />,
        title: "Notes AI",
        desc: "Turn chapters into clean notes (simple, detailed, outline styles).",
    },
    {
        icon: <Sparkles className="h-5 w-5" />,
        title: "Flashcards AI",
        desc: "Generate decks instantly from your material for quick memorization and review.",
    },
    {
        icon: <GraduationCap className="h-5 w-5" />,
        title: "Quizzes AI (Easy / Medium / Hard)",
        desc: "Practice with difficulty options — from quick recall to deeper understanding.",
    },
    {
        icon: <FileText className="h-5 w-5" />,
        title: "Essay grader (with analysis)",
        desc: "Submit an essay and get structured feedback, strengths/weaknesses, and improvements.",
    },
    {
        icon: <CalendarDays className="h-5 w-5" />,
        title: "Study calendar",
        desc: "Generate a study plan and daily tasks to stay consistent up to exam day.",
    },
    {
        icon: <ScanText className="h-5 w-5" />,
        title: "OCR + PDF extraction",
        desc: "Scanned pages and PDFs supported, so you can work with real school materials.",
    },
    {
        icon: <BookOpen className="h-5 w-5" />,
        title: "Library for your materials",
        desc: "Upload and organize your documents so everything is in one place.",
    },
];

const VOICE_FEATURES: Feature[] = [
    {
        icon: <Volume2 className="h-5 w-5" />,
        title: "Text-to-speech voices",
        desc: "Listen to your notes, chapters, and outputs so you can study anywhere.",
    },
    {
        icon: <Zap className="h-5 w-5" />,
        title: "Speed control",
        desc: "Listen faster when reviewing and slow down when learning new material.",
    },
    {
        icon: <Languages className="h-5 w-5" />,
        title: "Translation support",
        desc: "Translate sections as needed — great for bilingual learners and language practice.",
    },
    {
        icon: <Download className="h-5 w-5" />,
        title: "Audio downloads",
        desc: "Download audio to keep it offline for commutes and low-data situations.",
    },
];

export default function FeaturesPage() {
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
                        <p className="text-xs tracking-[0.25em] text-white/60 uppercase">About</p>
                        <h1 className="mt-3 text-4xl md:text-5xl font-semibold">Lexaro Features</h1>
                        <p className="mt-4 text-white/70 max-w-2xl">
                            Everything Lexaro offers — built around a simple loop:{" "}
                            <span className="text-white font-semibold">Upload → Ask → Practice → Listen</span>.
                        </p>

                        <div className="mt-7 flex flex-wrap gap-3">
                            <ShimmerButton href="/get-started" variant="primary">
                                Try it free
                            </ShimmerButton>
                            <ShimmerButton href="/plans" variant="ghost">
                                See pricing
                            </ShimmerButton>
                        </div>
                    </FadeInSection>
                </div>
            </section>

            <FluidGlassSection tone="blue">
                <div className="mx-auto max-w-6xl px-4 md:px-6 py-20">
                    <FadeInSection>
                        <SectionHeader
                            kicker="Lexaro Learn"
                            title="Study tools that work together"
                            subtitle="Notes, flashcards, quizzes, tutoring, grading, and planning — all tied to your materials."
                        />
                    </FadeInSection>

                    <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {LEARN_FEATURES.map((f) => (
                            <FadeInSection key={f.title} delay={0.04}>
                                <StarBorderCard>
                                    <div className="p-6">
                                        <FeatureCard icon={f.icon} title={f.title} desc={f.desc} />
                                    </div>
                                </StarBorderCard>
                            </FadeInSection>
                        ))}
                    </div>
                </div>
            </FluidGlassSection>

            <FluidGlassSection tone="violet">
                <div className="mx-auto max-w-6xl px-4 md:px-6 py-20">
                    <FadeInSection>
                        <SectionHeader
                            kicker="Lexaro Voice"
                            title="Listen while you learn"
                            subtitle="Turn reading into audio for revision, accessibility, and studying on the go."
                        />
                    </FadeInSection>

                    <div className="mt-10 grid gap-6 md:grid-cols-2">
                        {VOICE_FEATURES.map((f) => (
                            <FadeInSection key={f.title} delay={0.04}>
                                <StarBorderCard>
                                    <div className="p-6">
                                        <FeatureCard icon={f.icon} title={f.title} desc={f.desc} />
                                    </div>
                                </StarBorderCard>
                            </FadeInSection>
                        ))}
                    </div>

                    <FadeInSection delay={0.08}>
                        <div className="mt-10 rounded-3xl border border-white/10 bg-black/55 backdrop-blur-md p-8 text-center">
                            <h3 className="text-2xl md:text-3xl font-semibold">Ready to use it?</h3>
                            <p className="mt-3 text-white/70 max-w-2xl mx-auto">
                                Start free, upload a PDF, and use Lexaro Learn + Voice in one workflow.
                            </p>
                            <div className="mt-6 flex flex-wrap justify-center gap-3">
                                <ShimmerButton href="/get-started" variant="primary">
                                    Create your account
                                </ShimmerButton>
                                <ShimmerButton href="/plans" variant="ghost">
                                    Compare plans
                                </ShimmerButton>
                            </div>
                        </div>
                    </FadeInSection>
                </div>
            </FluidGlassSection>

            <Footer />
        </main>
    );
}

function SectionHeader({
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

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
    return (
        <div>
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                    {icon}
                </div>
                <div className="text-lg font-semibold">{title}</div>
            </div>
            <p className="mt-3 text-white/70">{desc}</p>
        </div>
    );
}
