"use client";

import React from "react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FAQ from "@/components/FAQ";
import CTA from "@/components/CTA";
import VoicesShowcase from "@/components/VoicesShowcase";

import PremiumHero from "@/components/landing/PremiumHero";
import DemoShowcase from "@/components/landing/DemoShowcase";
import TestimonialsCarousel from "@/components/landing/TestimonialsCarousel";

import FluidGlassSection from "@/components/reactbits/FluidGlassSection";
import StarBorderCard from "@/components/reactbits/StarBorderCard";
import FadeInSection from "@/components/reactbits/FadeInSection";
import ShimmerButton from "@/components/reactbits/ShimmerButton";

import Link from "next/link";

import {
    ArrowRight,
    BookOpen,
    CheckCircle2,
    FileText,
    Headphones,
    LayoutGrid,
    Sparkles,
    Zap,
} from "lucide-react";

import {
    IconMessageDots,
    IconFileUpload,
    IconCards,
    IconBrain,
    IconChartBar,
    IconChecklist,
    IconCalendarEvent,
    IconSchool,
    IconBadge,
} from "@tabler/icons-react";

function cn(...classes: Array<string | undefined | false | null>) {
    return classes.filter(Boolean).join(" ");
}

type FeatureCardProps = {
    title: string;
    desc: string;
    icon: React.ReactNode;
    href?: string;
    tag?: string;
};

function FeatureCard({ title, desc, icon, href, tag }: FeatureCardProps) {
    const inner = (
        <div className="p-6 md:p-7">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            {icon}
          </span>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="text-base md:text-lg font-semibold text-white">{title}</h3>
                            {tag ? (
                                <span className="hidden sm:inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/70">
                  {tag}
                </span>
                            ) : null}
                        </div>
                        <p className="mt-1 text-sm text-white/70">{desc}</p>
                    </div>
                </div>
                <div className="opacity-70">
                    <ArrowRight className="h-4 w-4" />
                </div>
            </div>
        </div>
    );

    if (!href) return <StarBorderCard>{inner}</StarBorderCard>;

    return (
        <Link href={href} className="block">
            <StarBorderCard>{inner}</StarBorderCard>
        </Link>
    );
}

export default function Page() {
    return (
        <main className="bg-black text-white">
            <Navbar />

            {/* Premium hero (glassy + shader bg) */}
            <PremiumHero />

            {/* Demo/preview (video placeholders + mock analytics) */}
            <DemoShowcase />

            {/* ===== Lexaro Learn (Education Suite) ===== */}
            <FluidGlassSection tone="violet">
                <div className="mx-auto max-w-6xl px-4 md:px-6 py-20">
                    <FadeInSection>
                        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                            <div className="max-w-3xl">
                                <p className="text-xs tracking-[0.25em] text-white/60 uppercase">Lexaro Learn</p>
                                <h2 className="mt-2 text-3xl md:text-4xl font-semibold">
                                    A full study workflow — from PDF to mastery.
                                </h2>
                                <p className="mt-3 text-white/70">
                                    Upload once, then chat with citations, generate notes, drill with flashcards, take quizzes, grade essays,
                                    and track progress — all in one place.
                                </p>

                                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                    <IconFileUpload className="h-4 w-4" />
                    Upload PDFs
                  </span>
                                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                    <IconMessageDots className="h-4 w-4" />
                    Citations + chat
                  </span>
                                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                    <IconChartBar className="h-4 w-4" />
                    Progress + weak topics
                  </span>
                                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                    <Zap className="h-4 w-4" />
                    Attempt → grade → improve loop
                  </span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <ShimmerButton href="/get-started" variant="primary">
                                    Try it free
                                </ShimmerButton>
                                <ShimmerButton href="/plans" variant="ghost">
                                    See plans <ArrowRight className="h-4 w-4" />
                                </ShimmerButton>
                            </div>
                        </div>
                    </FadeInSection>

                    <div className="mt-10 grid gap-6 lg:grid-cols-12">
                        {/* Big left card: Suite overview */}
                        <div className="lg:col-span-5">
                            <FadeInSection delay={0.06}>
                                <StarBorderCard>
                                    <div className="p-7">
                                        <div className="flex items-center gap-3">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                        <IconSchool className="h-6 w-6" />
                      </span>
                                            <div>
                                                <div className="text-sm text-white/60">Study suite</div>
                                                <div className="text-lg font-semibold">Everything is connected</div>
                                            </div>
                                        </div>

                                        <div className="mt-6 grid gap-3">
                                            {[
                                                { t: "Chat with citations", d: "Ask questions and get page-aware answers you can trust." },
                                                { t: "Notes generation", d: "Outline, Cornell, detailed — built from your document content." },
                                                { t: "Flashcards", d: "Definition, Q&A, cloze, or mixed decks." },
                                                { t: "Quizzes + grading", d: "Easy → hard difficulty with feedback + next steps." },
                                                { t: "Essay grading", d: "Rubric-based scoring with actionable improvements." },
                                                { t: "Study calendar", d: "Plans that adapt to weak topics and missed questions." },
                                            ].map((x) => (
                                                <div
                                                    key={x.t}
                                                    className="rounded-2xl border border-white/10 bg-black/40 p-4"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <CheckCircle2 className="h-5 w-5 mt-0.5 opacity-80" />
                                                        <div>
                                                            <div className="font-medium">{x.t}</div>
                                                            <div className="mt-1 text-sm text-white/70">{x.d}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-6 flex flex-wrap gap-3">
                                            <ShimmerButton href="/get-started" variant="primary">
                                                Start studying
                                            </ShimmerButton>
                                            <ShimmerButton href="/about/features" variant="ghost">
                                                Explore features <ArrowRight className="h-4 w-4" />
                                            </ShimmerButton>
                                        </div>

                                        <p className="mt-4 text-xs text-white/50">
                                            Built to feel like a premium exam platform: clear outputs, clear next steps, consistent structure.
                                        </p>
                                    </div>
                                </StarBorderCard>
                            </FadeInSection>
                        </div>

                        {/* Feature grid */}
                        <div className="lg:col-span-7">
                            <div className="grid gap-6 sm:grid-cols-2">
                                <FadeInSection delay={0.08}>
                                    <FeatureCard
                                        title="AI Tutor Chat"
                                        desc="Doc-grounded answers with page citations + quick study actions."
                                        icon={<IconMessageDots className="h-6 w-6" />}
                                        href="/get-started"
                                        tag="Citations"
                                    />
                                </FadeInSection>

                                <FadeInSection delay={0.1}>
                                    <FeatureCard
                                        title="Notes AI"
                                        desc="Outline, Cornell, detailed, and exam-style summary sheets."
                                        icon={<FileText className="h-6 w-6" />}
                                        href="/get-started"
                                        tag="Notes"
                                    />
                                </FadeInSection>

                                <FadeInSection delay={0.12}>
                                    <FeatureCard
                                        title="Flashcards"
                                        desc="Generate decks and drill weak topics faster with spaced review."
                                        icon={<IconCards className="h-6 w-6" />}
                                        href="/get-started"
                                        tag="Flashcards"
                                    />
                                </FadeInSection>

                                <FadeInSection delay={0.14}>
                                    <FeatureCard
                                        title="Quizzes + Attempts"
                                        desc="Take quizzes, get graded, see why you missed points, retake smarter."
                                        icon={<IconChecklist className="h-6 w-6" />}
                                        href="/get-started"
                                        tag="Grading"
                                    />
                                </FadeInSection>

                                <FadeInSection delay={0.16}>
                                    <FeatureCard
                                        title="Essay Grader"
                                        desc="Rubric-based marking with actionable fixes and improvement plan."
                                        icon={<IconBrain className="h-6 w-6" />}
                                        href="/get-started"
                                        tag="Rubrics"
                                    />
                                </FadeInSection>

                                <FadeInSection delay={0.18}>
                                    <FeatureCard
                                        title="Study Calendar"
                                        desc="A plan that adapts to your performance and weak areas."
                                        icon={<IconCalendarEvent className="h-6 w-6" />}
                                        href="/get-started"
                                        tag="Adaptive"
                                    />
                                </FadeInSection>
                            </div>

                            <FadeInSection delay={0.2}>
                                <div className="mt-6 rounded-3xl border border-white/10 bg-black/45 backdrop-blur-md p-6 md:p-7">
                                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                        <div className="flex items-center gap-3">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                        <IconBadge className="h-6 w-6" />
                      </span>
                                            <div>
                                                <div className="text-sm text-white/60">Official-style outputs</div>
                                                <div className="text-lg font-semibold">Clear results, clear next steps</div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                        Difficulty + time estimate
                      </span>
                                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                        Sources / citations
                      </span>
                                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                        Next-step recommendations
                      </span>
                                        </div>
                                    </div>

                                    <div className="mt-5 grid gap-4 md:grid-cols-3">
                                        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                                            <div className="text-xs text-white/60 uppercase tracking-wider">Quiz</div>
                                            <div className="mt-2 text-sm">
                                                Score: <span className="font-semibold">4/5</span>
                                            </div>
                                            <div className="mt-2 text-sm text-white/70">
                                                Next: review pages 12–14 → retake (hard) → generate flashcards.
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                                            <div className="text-xs text-white/60 uppercase tracking-wider">Essay</div>
                                            <div className="mt-2 text-sm">
                                                Rubric: <span className="font-semibold">Structure 7/10</span>
                                            </div>
                                            <div className="mt-2 text-sm text-white/70">
                                                Fix: tighten topic sentences + add one stronger quote + link back to thesis.
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                                            <div className="text-xs text-white/60 uppercase tracking-wider">Progress</div>
                                            <div className="mt-2 text-sm">
                                                Accuracy: <span className="font-semibold">78%</span>
                                            </div>
                                            <div className="mt-2 text-sm text-white/70">
                                                Weak topic: Enzymes → drill with 12-card deck + 10-question quiz.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </FadeInSection>
                        </div>
                    </div>
                </div>
            </FluidGlassSection>

            {/* ===== Lexaro Voice (TTS Suite) ===== */}
            <FluidGlassSection tone="aqua">
                <div className="mx-auto max-w-6xl px-4 md:px-6 py-20">
                    <FadeInSection>
                        <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
                            <div className="lg:col-span-5">
                                <p className="text-xs tracking-[0.25em] text-white/60 uppercase">Lexaro Voice</p>
                                <h2 className="mt-2 text-3xl md:text-4xl font-semibold">
                                    Listen like it’s a premium audiobook — built for studying.
                                </h2>
                                <p className="mt-3 text-white/70">
                                    Generate clean audio from your content, pick voices instantly, and keep your study flow moving.
                                </p>

                                <div className="mt-5 grid gap-3">
                                    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/40 p-4">
                                        <Headphones className="h-5 w-5 mt-0.5 opacity-80" />
                                        <div>
                                            <div className="font-medium">Voice previews</div>
                                            <div className="mt-1 text-sm text-white/70">Tap a voice and hear it immediately — no friction.</div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/40 p-4">
                                        <Sparkles className="h-5 w-5 mt-0.5 opacity-80" />
                                        <div>
                                            <div className="font-medium">Study-friendly output</div>
                                            <div className="mt-1 text-sm text-white/70">
                                                Built to pair with Learn features: read, review, quiz, repeat.
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/40 p-4">
                                        <Zap className="h-5 w-5 mt-0.5 opacity-80" />
                                        <div>
                                            <div className="font-medium">Fast generation</div>
                                            <div className="mt-1 text-sm text-white/70">Optimized flow so audio feels instant for normal use.</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex flex-wrap gap-3">
                                    <ShimmerButton href="/get-started" variant="primary">
                                        Try voices
                                    </ShimmerButton>
                                    <ShimmerButton href="/plans" variant="ghost">
                                        See plans <ArrowRight className="h-4 w-4" />
                                    </ShimmerButton>
                                </div>

                                <p className="mt-4 text-xs text-white/50">
                                    Voice + Learn are designed together so your study loop stays seamless.
                                </p>
                            </div>

                            <div className="lg:col-span-7">
                                <FadeInSection delay={0.08}>
                                    <StarBorderCard>
                                        <div className="p-6 md:p-7">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3">
                          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                            <BookOpen className="h-6 w-6" />
                          </span>
                                                    <div>
                                                        <div className="text-sm text-white/60">Voice gallery</div>
                                                        <div className="text-lg font-semibold">Try some popular voices</div>
                                                    </div>
                                                </div>

                                                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                          Preview included
                        </span>
                                            </div>

                                            <div className="mt-5">
                                                <VoicesShowcase />
                                            </div>
                                        </div>
                                    </StarBorderCard>
                                </FadeInSection>

                                <FadeInSection delay={0.12}>
                                    <div className="mt-6 grid gap-6 sm:grid-cols-2">
                                        <StarBorderCard>
                                            <div className="p-6">
                                                <div className="flex items-center gap-3">
                          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                            <LayoutGrid className="h-6 w-6" />
                          </span>
                                                    <div className="font-semibold">Audio library</div>
                                                </div>
                                                <p className="mt-2 text-sm text-white/70">
                                                    Keep generated audio organized per document and session — so you can replay anytime.
                                                </p>
                                            </div>
                                        </StarBorderCard>

                                        <StarBorderCard>
                                            <div className="p-6">
                                                <div className="flex items-center gap-3">
                          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                            <Headphones className="h-6 w-6" />
                          </span>
                                                    <div className="font-semibold">Study listening mode</div>
                                                </div>
                                                <p className="mt-2 text-sm text-white/70">
                                                    A clean, distraction-free player experience tuned for reading support and revision.
                                                </p>
                                            </div>
                                        </StarBorderCard>
                                    </div>
                                </FadeInSection>
                            </div>
                        </div>
                    </FadeInSection>
                </div>
            </FluidGlassSection>

            {/* ===== Unified platform section (ties everything together) ===== */}
            <section className="relative overflow-hidden border-t border-white/10">
                <div className="mx-auto max-w-6xl px-4 md:px-6 py-20">
                    <FadeInSection>
                        <div className="text-center max-w-3xl mx-auto">
                            <p className="text-xs tracking-[0.25em] text-white/60 uppercase">One platform</p>
                            <h2 className="mt-2 text-3xl md:text-4xl font-semibold">
                                Built to feel premium from day one.
                            </h2>
                            <p className="mt-3 text-white/70">
                                Clear UI, consistent outputs, and a tight study loop that makes progress obvious.
                            </p>
                        </div>
                    </FadeInSection>

                    <div className="mt-10 grid gap-6 lg:grid-cols-12">
                        <div className="lg:col-span-4">
                            <FadeInSection delay={0.06}>
                                <StarBorderCard>
                                    <div className="p-6 md:p-7">
                                        <div className="flex items-center gap-3">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                        <IconChartBar className="h-6 w-6" />
                      </span>
                                            <div className="font-semibold">Progress hub</div>
                                        </div>
                                        <p className="mt-2 text-sm text-white/70">
                                            Attempts, grades, and weak topics come together so the next step is always clear.
                                        </p>
                                    </div>
                                </StarBorderCard>
                            </FadeInSection>
                        </div>

                        <div className="lg:col-span-4">
                            <FadeInSection delay={0.09}>
                                <StarBorderCard>
                                    <div className="p-6 md:p-7">
                                        <div className="flex items-center gap-3">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                        <FileText className="h-6 w-6" />
                      </span>
                                            <div className="font-semibold">Official-style grading</div>
                                        </div>
                                        <p className="mt-2 text-sm text-white/70">
                                            Structured feedback that mirrors real exam platforms: scores, reasons, fixes, next steps.
                                        </p>
                                    </div>
                                </StarBorderCard>
                            </FadeInSection>
                        </div>

                        <div className="lg:col-span-4">
                            <FadeInSection delay={0.12}>
                                <StarBorderCard>
                                    <div className="p-6 md:p-7">
                                        <div className="flex items-center gap-3">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                        <BookOpen className="h-6 w-6" />
                      </span>
                                            <div className="font-semibold">Library-first workflow</div>
                                        </div>
                                        <p className="mt-2 text-sm text-white/70">
                                            Every feature starts from your documents — so your study content always stays grounded.
                                        </p>
                                    </div>
                                </StarBorderCard>
                            </FadeInSection>
                        </div>
                    </div>

                    <FadeInSection delay={0.14}>
                        <div className="mt-10 flex flex-col items-center gap-3">
                            <div className="flex flex-wrap justify-center gap-3">
                                <ShimmerButton href="/get-started" variant="primary">
                                    Get started
                                </ShimmerButton>
                                <ShimmerButton href="/plans" variant="ghost">
                                    See pricing <ArrowRight className="h-4 w-4" />
                                </ShimmerButton>
                            </div>
                            <p className="text-xs text-white/50">
                                No filler sections — everything shown here is part of the core Lexaro product.
                            </p>
                        </div>
                    </FadeInSection>
                </div>
            </section>

            {/* Testimonials */}
            <TestimonialsCarousel />

            {/* CTA + FAQ */}
            <section className="relative overflow-hidden border-t border-white/10">
                <div className="relative z-10 mx-auto max-w-6xl px-4 md:px-6 py-20">
                    <FadeInSection>
                        <CTA />
                    </FadeInSection>

                    <div className="mt-14">
                        <FadeInSection>
                            <FAQ />
                        </FadeInSection>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
