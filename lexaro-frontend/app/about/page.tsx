"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import FloatingLinesBackground from "@/components/reactbits/FloatingLinesBackground";
import FluidGlassSection from "@/components/reactbits/FluidGlassSection";
import StarBorderCard from "@/components/reactbits/StarBorderCard";
import FadeInSection from "@/components/reactbits/FadeInSection";
import ShimmerButton from "@/components/reactbits/ShimmerButton";

import {
    ArrowRight,
    Quote,
    BookOpen,
    Mic2,
    Target,
    Sparkles,
    Shield,
    Zap,
    GraduationCap,
    CheckCircle2,
} from "lucide-react";

/**
 * About page - Company story, values, and product overview.
 */
export default function AboutPage() {
    return (
        <main className="bg-black text-white">
            <Navbar />

            {/* HERO */}
            <section className="relative overflow-hidden">
                <FloatingLinesBackground />

                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-violet-900/10 to-black/45" />
                    <div className="absolute -top-28 left-1/2 h-[540px] w-[980px] -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl" />
                    <div className="absolute top-44 left-1/3 h-[420px] w-[840px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />
                </div>

                <div className="relative z-10 mx-auto max-w-6xl px-4 md:px-6 pt-24 pb-16">
                    <FadeInSection>
                        <p className="text-xs tracking-[0.25em] text-white/60 uppercase">About Lexaro</p>
                        <h1 className="mt-3 text-4xl md:text-6xl font-semibold leading-tight max-w-4xl">
                            Built to make studying feel premium.
                        </h1>
                        <p className="mt-5 text-white/70 max-w-2xl text-lg">
                            Lexaro combines AI-powered study tools with natural voice, designed around one goal:
                            make progress obvious and studying less painful.
                        </p>
                    </FadeInSection>
                </div>
            </section>

            {/* OUR STORY */}
            <section className="border-t border-white/10">
                <div className="mx-auto max-w-6xl px-4 md:px-6 py-20">
                    <FadeInSection>
                        <div className="grid gap-12 lg:grid-cols-2 items-center">
                            <div>
                                <p className="text-xs tracking-[0.25em] text-violet-400 uppercase">Our Story</p>
                                <h2 className="mt-3 text-3xl md:text-4xl font-semibold leading-tight">
                                    Started by students, for students.
                                </h2>
                                <p className="mt-5 text-white/70">
                                    We got tired of jumping between apps, losing track of what we'd reviewed, and never knowing
                                    if we were actually making progress. So we built something better.
                                </p>
                                <p className="mt-4 text-white/70">
                                    Lexaro brings everything into one place: your documents, AI study tools, voice reading,
                                    and a clear view of what you've learned and what still needs work.
                                </p>
                            </div>

                            <div className="relative">
                                <StarBorderCard>
                                    <div className="p-6">
                                        <Quote className="h-8 w-8 text-violet-400 mb-4" />
                                        <p className="text-lg text-white/90 italic">
                                            "We wanted a tool that felt as good as the best apps we use daily —
                                            but built specifically for studying."
                                        </p>
                                        <p className="mt-4 text-sm text-white/60">— The Lexaro Team</p>
                                    </div>
                                </StarBorderCard>
                            </div>
                        </div>
                    </FadeInSection>
                </div>
            </section>

            {/* VALUES */}
            <FluidGlassSection tone="violet">
                <div className="mx-auto max-w-6xl px-4 md:px-6 py-20">
                    <FadeInSection>
                        <p className="text-xs tracking-[0.25em] text-violet-400 uppercase text-center">Our Values</p>
                        <h2 className="mt-3 text-3xl md:text-4xl font-semibold leading-tight text-center">
                            What we believe in.
                        </h2>
                    </FadeInSection>

                    <div className="mt-12 grid gap-6 md:grid-cols-2">
                        <FadeInSection delay={0.05}>
                            <ValueCard
                                icon={<Shield className="h-5 w-5 text-violet-400" />}
                                title="Citations first"
                                desc="Every answer points back to your materials so you can verify and trust the output. No hallucinations, no guessing."
                            />
                        </FadeInSection>

                        <FadeInSection delay={0.1}>
                            <ValueCard
                                icon={<Target className="h-5 w-5 text-blue-400" />}
                                title="The study loop"
                                desc="Attempt, grade, improve. Our tools are designed around this cycle so you're never guessing what to do next."
                            />
                        </FadeInSection>

                        <FadeInSection delay={0.15}>
                            <ValueCard
                                icon={<Sparkles className="h-5 w-5 text-cyan-400" />}
                                title="Premium feel"
                                desc="Clean UI, consistent outputs, and a focus on making progress visible. Studying should feel good."
                            />
                        </FadeInSection>

                        <FadeInSection delay={0.2}>
                            <ValueCard
                                icon={<GraduationCap className="h-5 w-5 text-amber-400" />}
                                title="Built for real students"
                                desc="From PDFs to exams, Lexaro handles the formats and workflows students actually use. No fluff, just results."
                            />
                        </FadeInSection>
                    </div>
                </div>
            </FluidGlassSection>

            {/* PRODUCTS OVERVIEW */}
            <FluidGlassSection tone="blue">
                <div className="mx-auto max-w-6xl px-4 md:px-6 py-20">
                    <FadeInSection>
                        <p className="text-xs tracking-[0.25em] text-blue-400 uppercase text-center">Our Products</p>
                        <h2 className="mt-3 text-3xl md:text-4xl font-semibold leading-tight text-center">
                            Two products, one workflow.
                        </h2>
                        <p className="mt-4 text-white/70 text-center max-w-2xl mx-auto">
                            Whether you prefer reading or listening, Lexaro has you covered.
                        </p>
                    </FadeInSection>

                    <div className="mt-12 grid gap-6 lg:grid-cols-2">
                        <FadeInSection delay={0.05}>
                            <StarBorderCard>
                                <div className="p-6 md:p-8">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
                                            <BookOpen className="h-6 w-6 text-violet-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold">Lexaro Learn</h3>
                                            <p className="text-sm text-white/60">AI Study Suite</p>
                                        </div>
                                    </div>

                                    <p className="text-white/70 mb-6">
                                        Upload your documents and let AI help you study. Chat with citations,
                                        generate quizzes, create flashcards, and track your progress.
                                    </p>

                                    <ul className="space-y-3">
                                        <FeatureItem text="Chat with AI tutor (citations included)" />
                                        <FeatureItem text="Auto-generated quizzes & flashcards" />
                                        <FeatureItem text="Smart notes in multiple styles" />
                                        <FeatureItem text="Essay grading with feedback" />
                                        <FeatureItem text="Progress tracking & weak topic alerts" />
                                    </ul>

                                    <div className="mt-6">
                                        <ShimmerButton href="/about/features" variant="ghost" className="text-sm">
                                            Learn more <ArrowRight className="h-4 w-4" />
                                        </ShimmerButton>
                                    </div>
                                </div>
                            </StarBorderCard>
                        </FadeInSection>

                        <FadeInSection delay={0.1}>
                            <StarBorderCard>
                                <div className="p-6 md:p-8">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center">
                                            <Mic2 className="h-6 w-6 text-cyan-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold">Lexaro Voice</h3>
                                            <p className="text-sm text-white/60">Premium Text-to-Speech</p>
                                        </div>
                                    </div>

                                    <p className="text-white/70 mb-6">
                                        Turn any document into natural-sounding audio. Perfect for commutes,
                                        workouts, or just when your eyes need a break.
                                    </p>

                                    <ul className="space-y-3">
                                        <FeatureItem text="Natural-sounding AI voices" />
                                        <FeatureItem text="Multiple languages & accents" />
                                        <FeatureItem text="Adjustable playback speed" />
                                        <FeatureItem text="Download for offline listening" />
                                        <FeatureItem text="Read-along mode with highlights" />
                                    </ul>

                                    <div className="mt-6">
                                        <ShimmerButton href="/about/features" variant="ghost" className="text-sm">
                                            Learn more <ArrowRight className="h-4 w-4" />
                                        </ShimmerButton>
                                    </div>
                                </div>
                            </StarBorderCard>
                        </FadeInSection>
                    </div>
                </div>
            </FluidGlassSection>

            {/* CTA */}
            <section className="border-t border-white/10">
                <div className="mx-auto max-w-4xl px-4 md:px-6 py-20 text-center">
                    <FadeInSection>
                        <h2 className="text-3xl md:text-4xl font-semibold">
                            Ready to upgrade your study workflow?
                        </h2>
                        <p className="mt-4 text-white/70 max-w-xl mx-auto">
                            Join thousands of students using Lexaro to study smarter. Start free, upgrade when you're ready.
                        </p>

                        <div className="mt-8 flex flex-wrap justify-center gap-3">
                            <ShimmerButton href="/get-started" variant="primary">
                                Get started free
                            </ShimmerButton>
                            <ShimmerButton href="/plans" variant="ghost">
                                See pricing <ArrowRight className="h-4 w-4" />
                            </ShimmerButton>
                        </div>
                    </FadeInSection>
                </div>
            </section>

            <Footer />
        </main>
    );
}

/**
 * Value card component for displaying core values.
 */
function ValueCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
    return (
        <StarBorderCard>
            <div className="p-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
                        {icon}
                    </div>
                    <h3 className="text-lg font-semibold">{title}</h3>
                </div>
                <p className="mt-3 text-white/70">{desc}</p>
            </div>
        </StarBorderCard>
    );
}

/**
 * Feature list item with checkmark.
 */
function FeatureItem({ text }: { text: string }) {
    return (
        <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
            <span className="text-sm text-white/80">{text}</span>
        </li>
    );
}
