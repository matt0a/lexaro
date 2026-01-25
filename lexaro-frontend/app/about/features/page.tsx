"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import VoicesShowcase from "@/components/VoicesShowcase";

import FloatingLinesBackground from "@/components/reactbits/FloatingLinesBackground";
import FluidGlassSection from "@/components/reactbits/FluidGlassSection";
import StarBorderCard from "@/components/reactbits/StarBorderCard";
import FadeInSection from "@/components/reactbits/FadeInSection";
import ShimmerButton from "@/components/reactbits/ShimmerButton";

import { ArrowRight, Quote, Upload, Volume2, BookOpen, ShieldCheck, Timer, Sparkles } from "lucide-react";
import { IconBrain, IconCards, IconChecklist, IconChartLine, IconTargetArrow, IconBolt } from "@tabler/icons-react";

export default function FeaturesPage() {
    return (
        <main className="bg-black text-white">
            <Navbar />

            {/* HERO */}
            <section className="relative overflow-hidden">
                <FloatingLinesBackground />

                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-sky-900/10 to-black/45" />
                    <div className="absolute -top-28 left-1/2 h-[540px] w-[980px] -translate-x-1/2 rounded-full bg-sky-500/10 blur-3xl" />
                    <div className="absolute top-44 left-1/3 h-[420px] w-[840px] -translate-x-1/2 rounded-full bg-fuchsia-500/10 blur-3xl" />
                </div>

                <div className="relative z-10 mx-auto max-w-6xl px-4 md:px-6 pt-24 pb-12">
                    <FadeInSection>
                        <p className="text-xs tracking-[0.25em] text-white/60 uppercase">Features</p>
                        <h1 className="mt-3 text-4xl md:text-6xl font-semibold leading-tight">
                            One place to read, practice, and improve — fast.
                        </h1>
                        <p className="mt-5 text-white/70 max-w-2xl text-lg">
                            Lexaro brings your documents, study tools, and voice into a single workflow — built to feel premium, clean,
                            and reliable.
                        </p>

                        <div className="mt-8 flex flex-wrap gap-3">
                            <ShimmerButton href="/get-started" variant="primary">
                                Get started
                            </ShimmerButton>
                            <ShimmerButton href="/plans" variant="ghost">
                                See pricing <ArrowRight className="h-4 w-4" />
                            </ShimmerButton>
                        </div>
                    </FadeInSection>

                    <FadeInSection delay={0.08}>
                        <div className="mt-10 grid gap-4 md:grid-cols-3">
                            <MiniStat icon={<Timer className="h-4 w-4" />} title="Fast workflow" desc="Upload → ask → practice." />
                            <MiniStat icon={<ShieldCheck className="h-4 w-4" />} title="Citations" desc="Jump to the exact page." />
                            <MiniStat icon={<Sparkles className="h-4 w-4" />} title="Better retention" desc="Quizzes + flashcards built in." />
                        </div>
                    </FadeInSection>
                </div>
            </section>

            {/* LEXARO LEARN */}
            <FluidGlassSection tone="blue">
                <div className="mx-auto max-w-6xl px-4 md:px-6 py-20">
                    <FadeInSection>
                        <SectionHeader
                            kicker="Lexaro Learn"
                            title="Study tools built around your documents"
                            subtitle="Ask questions with citations, then generate practice that reinforces what you missed."
                        />
                    </FadeInSection>

                    <div className="mt-10 grid gap-6 lg:grid-cols-12">
                        {/* Left: big feature grid */}
                        <div className="lg:col-span-7 space-y-6">
                            <FadeInSection delay={0.06}>
                                <StarBorderCard>
                                    <div className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm font-semibold">Doc-grounded Q&A</div>
                                            <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-white/70">
                        Page links
                      </span>
                                        </div>

                                        <div className="mt-5 space-y-3">
                                            <ChatBubble who="You" text="Explain this simply, then quiz me." />
                                            <ChatBubble
                                                who="Lexaro"
                                                text="Here’s the simple version, plus a quick quiz based on your pages."
                                                chips={["Notes · page 3", "Textbook · page 12"]}
                                            />
                                            <ChatBubble who="Quick quiz" text="1) Main idea? 2) Example? 3) One tricky question." />
                                        </div>
                                    </div>
                                </StarBorderCard>
                            </FadeInSection>

                            <div className="grid gap-6 md:grid-cols-2">
                                <FadeInSection delay={0.1}>
                                    <FeatureCard
                                        icon={<IconBrain size={22} />}
                                        title="Study Copilot"
                                        desc="Ask while you read. Answers include citations so you can verify instantly."
                                    />
                                </FadeInSection>

                                <FadeInSection delay={0.14}>
                                    <FeatureCard
                                        icon={<IconChecklist size={22} />}
                                        title="Notes generator"
                                        desc="Turn a chapter into clean, structured notes with one click."
                                    />
                                </FadeInSection>

                                <FadeInSection delay={0.18}>
                                    <FeatureCard
                                        icon={<IconCards size={22} />}
                                        title="Flashcards"
                                        desc="Create decks from your material and drill what matters."
                                    />
                                </FadeInSection>

                                <FadeInSection delay={0.22}>
                                    <FeatureCard
                                        icon={<IconTargetArrow size={22} />}
                                        title="Quizzes"
                                        desc="Generate quizzes by difficulty and get feedback that helps you improve."
                                    />
                                </FadeInSection>

                                <FadeInSection delay={0.26}>
                                    <FeatureCard
                                        icon={<IconChartLine size={22} />}
                                        title="Progress hub"
                                        desc="Track attempts, accuracy, weak areas, and what to review next."
                                    />
                                </FadeInSection>

                                <FadeInSection delay={0.3}>
                                    <FeatureCard
                                        icon={<BookOpen className="h-5 w-5" />}
                                        title="Study plan"
                                        desc="A structured path: read, practice, review — with clear daily tasks."
                                    />
                                </FadeInSection>
                            </div>
                        </div>

                        {/* Right: actions */}
                        <div className="lg:col-span-5">
                            <FadeInSection delay={0.12}>
                                <StarBorderCard>
                                    <div className="p-6">
                                        <div className="text-lg font-semibold">A premium loop</div>
                                        <p className="mt-2 text-white/70">
                                            The experience is designed around an “attempt → grade → improve” loop — so you’re never guessing
                                            what to do next.
                                        </p>

                                        <div className="mt-6 grid gap-3">
                                            <PillRow icon={<Quote className="h-4 w-4" />} title="Citations included" desc="Every answer points back to your pages." />
                                            <PillRow icon={<IconBolt size={18} />} title="Fast practice" desc="Generate quizzes/flashcards instantly." />
                                            <PillRow icon={<Upload className="h-4 w-4" />} title="Works on real PDFs" desc="OCR + extraction support for scanned pages." />
                                        </div>

                                        <div className="mt-7 flex flex-wrap gap-3">
                                            <ShimmerButton href="/get-started" variant="primary" className="justify-center">
                                                Try it
                                            </ShimmerButton>
                                            <ShimmerButton href="/plans" variant="ghost" className="justify-center">
                                                Pricing <ArrowRight className="h-4 w-4" />
                                            </ShimmerButton>
                                        </div>

                                        <p className="mt-3 text-xs text-white/50">Free is limited.</p>
                                    </div>
                                </StarBorderCard>
                            </FadeInSection>
                        </div>
                    </div>
                </div>
            </FluidGlassSection>

            {/* LEXARO VOICE */}
            <FluidGlassSection tone="violet">
                <div className="mx-auto max-w-6xl px-4 md:px-6 py-20">
                    <FadeInSection>
                        <SectionHeader
                            kicker="Lexaro Voice"
                            title="Listen to your material with premium voices"
                            subtitle="Perfect for studying on the go, reading support, and fast review."
                        />
                    </FadeInSection>

                    <div className="mt-10 grid gap-6 lg:grid-cols-12">
                        <div className="lg:col-span-7">
                            <FadeInSection delay={0.08}>
                                <StarBorderCard>
                                    <div className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm font-semibold">Voice gallery</div>
                                            <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-white/70">
                        Preview included
                      </span>
                                        </div>
                                        <div className="mt-5">
                                            <VoicesShowcase />
                                        </div>
                                    </div>
                                </StarBorderCard>
                            </FadeInSection>
                        </div>

                        <div className="lg:col-span-5 space-y-6">
                            <FadeInSection delay={0.12}>
                                <BigCard
                                    icon={<Volume2 className="h-5 w-5" />}
                                    title="Study anywhere"
                                    desc="Turn chapters into audio and keep moving — walking, commuting, or cleaning up."
                                />
                            </FadeInSection>

                            <FadeInSection delay={0.16}>
                                <BigCard
                                    icon={<Timer className="h-5 w-5" />}
                                    title="Speed control"
                                    desc="Review faster by increasing playback speed — great for revision sessions."
                                />
                            </FadeInSection>

                            <FadeInSection delay={0.2}>
                                <BigCard
                                    icon={<ShieldCheck className="h-5 w-5" />}
                                    title="Clean and simple"
                                    desc="Pick a voice, hit play, and focus — no setup or messy UI."
                                />
                            </FadeInSection>
                        </div>
                    </div>
                </div>
            </FluidGlassSection>

            {/* Closing CTA */}
            <section className="relative overflow-hidden">
                <FloatingLinesBackground />
                <div className="relative z-10 mx-auto max-w-6xl px-4 md:px-6 py-20">
                    <FadeInSection>
                        <div className="rounded-3xl border border-white/10 bg-black/55 backdrop-blur-md p-8 text-center">
                            <h3 className="text-2xl md:text-3xl font-semibold">Everything looks and feels seamless.</h3>
                            <p className="mt-3 text-white/70 max-w-2xl mx-auto">
                                The landing page, features, and pricing are designed as one cohesive premium system.
                            </p>
                            <div className="mt-6 flex flex-wrap justify-center gap-3">
                                <ShimmerButton href="/get-started" variant="primary">
                                    Get started
                                </ShimmerButton>
                                <ShimmerButton href="/plans" variant="ghost">
                                    View pricing <ArrowRight className="h-4 w-4" />
                                </ShimmerButton>
                            </div>
                        </div>
                    </FadeInSection>
                </div>
            </section>

            <Footer />
        </main>
    );
}

/* -----------------------------
   Local UI bits
------------------------------ */

function SectionHeader({ kicker, title, subtitle }: { kicker: string; title: string; subtitle: string }) {
    return (
        <div>
            <p className="text-xs tracking-[0.25em] text-white/60 uppercase">{kicker}</p>
            <h2 className="mt-2 text-3xl md:text-4xl font-semibold">{title}</h2>
            <p className="mt-3 text-white/70 max-w-2xl">{subtitle}</p>
        </div>
    );
}

function MiniStat({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-black/55 backdrop-blur-md p-4">
            <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                    {icon}
                </div>
                <div className="font-semibold">{title}</div>
            </div>
            <div className="mt-2 text-sm text-white/65">{desc}</div>
        </div>
    );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
    return (
        <div className="rounded-3xl border border-white/10 bg-black/55 backdrop-blur-md p-6 shadow-[0_26px_90px_rgba(0,0,0,.65)]">
            <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
                    {icon}
                </div>
                <div className="text-lg font-semibold">{title}</div>
            </div>
            <p className="mt-3 text-white/70">{desc}</p>
        </div>
    );
}

function BigCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
    return (
        <StarBorderCard>
            <div className="p-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
                        {icon}
                    </div>
                    <div className="text-lg font-semibold">{title}</div>
                </div>
                <p className="mt-3 text-white/70">{desc}</p>
            </div>
        </StarBorderCard>
    );
}

function PillRow({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                    {icon}
                </div>
                <div className="font-semibold">{title}</div>
            </div>
            <div className="mt-2 text-sm text-white/65">{desc}</div>
        </div>
    );
}

function ChatBubble({ who, text, chips }: { who: string; text: string; chips?: string[] }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-white/60">{who}</div>
            <div className="mt-1 text-sm text-white/90">{text}</div>
            {chips?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                    {chips.map((c) => (
                        <span key={c} className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-white/70">
              {c}
            </span>
                    ))}
                </div>
            ) : null}
        </div>
    );
}
