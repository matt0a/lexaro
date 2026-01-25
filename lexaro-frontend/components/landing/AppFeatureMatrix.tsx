"use client";

import React from "react";
import Link from "next/link";
import FadeInSection from "@/components/reactbits/FadeInSection";
import GlareHoverCard from "@/components/reactbits/GlareHoverCard";
import {
    BookOpen,
    FileUp,
    Volume2,
    AudioLines,
    Languages,
    ListChecks,
    Sparkles,
    Quote,
    GraduationCap,
    FileText,
    CalendarDays,
    BarChart3,
    ArrowRight,
    CheckCircle2,
    Clock4,
} from "lucide-react";

type Pill = {
    label: string;
    tone?: "green" | "blue" | "purple" | "gray";
};

type Feature = {
    title: string;
    desc: string;
    bullets: string[];
    icon: React.ReactNode;
    pills: Pill[];
    toneClass: string; // subtle background gradient per card
};

function pillTone(tone: Pill["tone"]) {
    switch (tone) {
        case "green":
            return "bg-emerald-400/15 text-emerald-200 border-emerald-400/25";
        case "blue":
            return "bg-sky-400/15 text-sky-200 border-sky-400/25";
        case "purple":
            return "bg-violet-400/15 text-violet-200 border-violet-400/25";
        case "gray":
        default:
            return "bg-white/10 text-white/70 border-white/15";
    }
}

function FeatureCard({ f }: { f: Feature }) {
    return (
        <GlareHoverCard className={["border border-white/10", f.toneClass].join(" ")}>
            <div className="flex items-start justify-between gap-4">
                <div className="inline-flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
            {f.icon}
          </span>
                    <div>
                        <h3 className="text-base font-semibold text-white">{f.title}</h3>
                        <p className="mt-1 text-sm text-white/70">{f.desc}</p>
                    </div>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                {f.pills.map((p) => (
                    <span
                        key={p.label}
                        className={[
                            "inline-flex items-center rounded-full border px-2.5 py-1 text-xs",
                            pillTone(p.tone),
                        ].join(" ")}
                    >
            {p.label}
          </span>
                ))}
            </div>

            <ul className="mt-4 space-y-2">
                {f.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-white/75">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-white/40" />
                        <span>{b}</span>
                    </li>
                ))}
            </ul>
        </GlareHoverCard>
    );
}

export default function AppFeatureMatrix({ id }: { id?: string }) {
    const availableNow: Feature[] = [
        {
            title: "Upload & Library",
            desc: "Keep all your PDFs and materials organized in one place.",
            bullets: ["Upload PDFs", "Browse and manage documents", "Fast access from dashboard"],
            icon: <FileUp className="h-5 w-5 text-white/85" />,
            pills: [
                { label: "Available now", tone: "green" },
                { label: "Core", tone: "gray" },
            ],
            toneClass: "bg-gradient-to-b from-white/8 to-white/5",
        },
        {
            title: "Text → Speech (TTS)",
            desc: "Turn study materials into audio and learn hands-free.",
            bullets: ["Natural voices", "Audio generation + playback", "Great for studying & reading support"],
            icon: <AudioLines className="h-5 w-5 text-white/85" />,
            pills: [
                { label: "Available now", tone: "green" },
                { label: "Listen", tone: "blue" },
            ],
            toneClass: "bg-gradient-to-b from-sky-500/12 to-white/5",
        },
        {
            title: "Voice Previews",
            desc: "Try voices instantly before generating full audio.",
            bullets: ["Tap-to-preview UX", "Voice gallery", "Pick tone/style quickly"],
            icon: <Volume2 className="h-5 w-5 text-white/85" />,
            pills: [
                { label: "Available now", tone: "green" },
                { label: "Premium feel", tone: "gray" },
            ],
            toneClass: "bg-gradient-to-b from-violet-500/12 to-white/5",
        },
        {
            title: "Translate",
            desc: "Translate text and learning content across languages.",
            bullets: ["Quick translations", "Useful for bilingual study", "Pairs well with TTS"],
            icon: <Languages className="h-5 w-5 text-white/85" />,
            pills: [
                { label: "Available now", tone: "green" },
                { label: "Tools", tone: "gray" },
            ],
            toneClass: "bg-gradient-to-b from-cyan-400/12 to-white/5",
        },
    ];

    const comingNext: Feature[] = [
        {
            title: "AI Tutor with Citations",
            desc: "Ask questions and get answers linked to the exact pages.",
            bullets: ["Doc-grounded answers", "Clickable page citations", "Explain simply / deep modes"],
            icon: <Quote className="h-5 w-5 text-white/85" />,
            pills: [
                { label: "Coming next", tone: "purple" },
                { label: "Learn", tone: "purple" },
            ],
            toneClass: "bg-gradient-to-b from-violet-500/12 to-white/5",
        },
        {
            title: "Notes • Flashcards • Quizzes",
            desc: "Generate practice tools from your chapters in one click.",
            bullets: ["Notes styles (outline/Cornell/etc.)", "Flashcards (QA/cloze/mixed)", "Quizzes (easy/med/hard)"],
            icon: <Sparkles className="h-5 w-5 text-white/85" />,
            pills: [
                { label: "Coming next", tone: "purple" },
                { label: "Attempt → grade → improve", tone: "gray" },
            ],
            toneClass: "bg-gradient-to-b from-sky-500/12 to-white/5",
        },
        {
            title: "Essay Grader (Mark-by-Mark)",
            desc: "Structured scoring, actionable fixes, and rewrite suggestions.",
            bullets: ["Rubric scoring", "Strengths + weaknesses", "Rewrite one paragraph button"],
            icon: <FileText className="h-5 w-5 text-white/85" />,
            pills: [
                { label: "Coming next", tone: "purple" },
                { label: "Official output format", tone: "gray" },
            ],
            toneClass: "bg-gradient-to-b from-fuchsia-500/12 to-white/5",
        },
        {
            title: "Progress Hub + Study Calendar",
            desc: "Track accuracy, streak, weak topics, and a plan that adapts.",
            bullets: ["Accuracy % + streak", "Weak topics recommendations", "Calendar tasks + adaptive plan"],
            icon: <BarChart3 className="h-5 w-5 text-white/85" />,
            pills: [
                { label: "Coming next", tone: "purple" },
                { label: "Exam mode", tone: "gray" },
            ],
            toneClass: "bg-gradient-to-b from-emerald-400/12 to-white/5",
        },
    ];

    return (
        <section id={id} className="relative overflow-hidden border-t border-white/10">
            {/* background */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-b from-black via-[#070A12] to-black" />
                <div className="absolute -top-40 left-1/2 h-[560px] w-[980px] -translate-x-1/2 rounded-full bg-white/5 blur-3xl" />
                <div className="absolute -bottom-40 left-1/2 h-[560px] w-[980px] -translate-x-1/2 rounded-full bg-sky-500/10 blur-3xl" />
            </div>

            <div className="relative z-10 mx-auto max-w-6xl px-4 md:px-6 py-20">
                <FadeInSection>
                    <div className="flex flex-col gap-3">
                        <div className="inline-flex items-center gap-2 text-xs text-white/60">
                            <Clock4 className="h-4 w-4" />
                            <span>Product overview</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
                            The full Lexaro platform
                        </h2>
                        <p className="max-w-2xl text-white/70">
                            We’re building a premium study suite — listen to documents, translate content, and (next) learn with citations,
                            practice tools, grading, and progress tracking.
                        </p>

                        <div className="mt-2 flex items-center gap-3">
                            <Link
                                href="/get-started"
                                className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90 transition"
                            >
                                Get started
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>

                            <Link
                                href="/plans"
                                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/85 hover:bg-white/10 hover:text-white transition"
                            >
                                See pricing
                            </Link>
                        </div>
                    </div>
                </FadeInSection>

                {/* Available now */}
                <div className="mt-12">
                    <FadeInSection>
                        <div className="flex items-center justify-between gap-4">
                            <h3 className="text-lg font-semibold text-white">Available now</h3>
                            <span className="text-sm text-white/60">Core features you can use today</span>
                        </div>
                    </FadeInSection>

                    <div className="mt-6 grid gap-6 md:grid-cols-2">
                        {availableNow.map((f, idx) => (
                            <FadeInSection key={f.title} delay={0.05 + idx * 0.04}>
                                <FeatureCard f={f} />
                            </FadeInSection>
                        ))}
                    </div>
                </div>

                {/* Coming next */}
                <div className="mt-14">
                    <FadeInSection>
                        <div className="flex items-center justify-between gap-4">
                            <h3 className="text-lg font-semibold text-white">Coming next</h3>
                            <span className="text-sm text-white/60">Lexaro Learn + exam-style loop</span>
                        </div>
                    </FadeInSection>

                    <div className="mt-6 grid gap-6 md:grid-cols-2">
                        {comingNext.map((f, idx) => (
                            <FadeInSection key={f.title} delay={0.05 + idx * 0.04}>
                                <FeatureCard f={f} />
                            </FadeInSection>
                        ))}
                    </div>

                    <FadeInSection delay={0.22}>
                        <div className="mt-8 flex items-center gap-2 text-sm text-white/70">
                            <BookOpen className="h-4 w-4 text-white/50" />
                            <span>
                Want the full breakdown?{" "}
                                <Link href="/about/features" className="text-white hover:underline">
                  View the feature list
                </Link>
                .
              </span>
                        </div>
                    </FadeInSection>
                </div>
            </div>
        </section>
    );
}
