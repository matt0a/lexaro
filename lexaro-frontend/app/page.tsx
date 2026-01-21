"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FAQ from "@/components/FAQ";
import CTA from "@/components/CTA";
import VoicesShowcase from "@/components/VoicesShowcase";

import ShimmerButton from "@/components/reactbits/ShimmerButton";
import StarBorderCard from "@/components/reactbits/StarBorderCard";
import GlareHoverCard from "@/components/reactbits/GlareHoverCard";
import FluidGlassSection from "@/components/reactbits/FluidGlassSection";
import WordPullUp from "@/components/reactbits/WordPullUp";
import FadeInSection from "@/components/reactbits/FadeInSection";

import LightPillarsBackground from "@/components/reactbits/LightPillarsBackground";
import FloatingLinesBackground from "@/components/reactbits/FloatingLinesBackground";

import {
    ArrowRight,
    Upload,
    Quote,
    Sparkles,
    Volume2,
    Languages,
    BookOpen,
    ShieldCheck,
    Timer,
    CheckCircle2,
    Zap,
    MousePointerClick,
} from "lucide-react";

export default function Page() {
    return (
        <main className="bg-black text-white">
            <Navbar />

            {/* HERO */}
            <section className="relative min-h-[92vh] overflow-hidden flex items-center">
                <LightPillarsBackground />

                {/* subtle hero vignette */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/40" />

                <div className="relative z-10 mx-auto max-w-6xl px-6 pt-20 pb-10">
                    <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
                        <div>
                            <FadeInSection>
                                <p className="text-xs tracking-[0.25em] text-white/60 uppercase">
                                    Study • Listen • Learn faster
                                </p>
                            </FadeInSection>

                            <FadeInSection delay={0.06}>
                                <WordPullUp
                                    text="Turn your PDFs into a personal study coach."
                                    className="mt-4 text-4xl md:text-6xl font-semibold leading-tight"
                                    delay={0.05}
                                />
                            </FadeInSection>

                            <FadeInSection delay={0.1}>
                                <p className="mt-6 text-white/80 text-lg max-w-xl">
                                    Upload your notes, ask questions, and get answers with{" "}
                                    <span className="text-white font-semibold">page links</span>. Then
                                    generate flashcards and quizzes in one click.
                                </p>
                            </FadeInSection>

                            <FadeInSection delay={0.14}>
                                <div className="mt-6 flex flex-wrap gap-2 text-xs text-white/70">
                                    <Pill icon={<Upload className="h-4 w-4" />} text="Upload PDFs & notes" />
                                    <Pill icon={<Quote className="h-4 w-4" />} text="Answers with sources" />
                                    <Pill icon={<Sparkles className="h-4 w-4" />} text="Flashcards & quizzes" />
                                    <Pill icon={<Volume2 className="h-4 w-4" />} text="Listen out loud" />
                                    <Pill icon={<Languages className="h-4 w-4" />} text="Translate instantly" />
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
                                    Free plan is limited so you can test it. Premium feels unlimited
                                    for normal use.
                                </p>
                            </FadeInSection>
                        </div>

                        {/* ✅ Live preview now has StarBorder */}
                        <div className="hidden lg:block">
                            <FadeInSection delay={0.12}>
                                <StarBorderCard>
                                    <div className="p-7">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm font-semibold">Live preview</div>
                                            <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-white/70">
                        Learn + Voice
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
                                                    Got you — here’s the quick explanation, plus a 3-question quiz.
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
                                                    1) What is ATP? 2) What creates the “pressure” to make ATP?
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </StarBorderCard>
                            </FadeInSection>
                        </div>
                    </div>
                </div>
            </section>

            {/* ✅ Lexaro Learn section now has its own background treatment */}
            <section className="relative overflow-hidden">
                <FloatingLinesBackground />

                {/* premium overlay behind the lines */}
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-sky-900/10 to-black/40" />
                    <div className="absolute -top-32 left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-sky-500/10 blur-3xl" />
                </div>

                <div className="relative z-10 mx-auto max-w-6xl px-6 py-20">
                    <FadeInSection>
                        <Header
                            kicker="Lexaro Learn"
                            title="Study without switching apps"
                            subtitle="Keep your materials, your questions, and your practice tools in one place."
                        />
                    </FadeInSection>

                    <div className="mt-10 grid gap-6 md:grid-cols-3">
                        <FadeInSection delay={0.05}>
                            <GlareHoverCard className="bg-gradient-to-b from-sky-500/12 to-white/5">
                                <CardTitle icon={<BookOpen className="h-5 w-5" />} title="Ask while you read" />
                                <p className="mt-3 text-white/70">
                                    Open a PDF and chat right beside it — no copy/paste.
                                </p>
                            </GlareHoverCard>
                        </FadeInSection>

                        <FadeInSection delay={0.12}>
                            <GlareHoverCard className="bg-gradient-to-b from-violet-500/12 to-white/5">
                                <CardTitle icon={<Quote className="h-5 w-5" />} title="Page links included" />
                                <p className="mt-3 text-white/70">
                                    Click the source and jump to the exact page.
                                </p>
                            </GlareHoverCard>
                        </FadeInSection>

                        <FadeInSection delay={0.18}>
                            <GlareHoverCard className="bg-gradient-to-b from-cyan-400/12 to-white/5">
                                <CardTitle icon={<Sparkles className="h-5 w-5" />} title="Practice instantly" />
                                <p className="mt-3 text-white/70">
                                    One click for flashcards and quizzes from your chapter.
                                </p>
                            </GlareHoverCard>
                        </FadeInSection>
                    </div>

                    <div className="mt-8 grid gap-4 md:grid-cols-3">
                        <FadeInSection delay={0.08}>
                            <MiniStat
                                icon={<Timer className="h-4 w-4" />}
                                title="Fast answers"
                                desc="Feels instant while you study"
                            />
                        </FadeInSection>
                        <FadeInSection delay={0.12}>
                            <MiniStat
                                icon={<ShieldCheck className="h-4 w-4" />}
                                title="Trust the source"
                                desc="Answers point to your pages"
                            />
                        </FadeInSection>
                        <FadeInSection delay={0.16}>
                            <MiniStat
                                icon={<Sparkles className="h-4 w-4" />}
                                title="Better memory"
                                desc="Practice tools built-in"
                            />
                        </FadeInSection>
                    </div>
                </div>
            </section>

            {/* Study flow */}
            <FluidGlassSection tone="blue">
                <div className="mx-auto max-w-6xl px-6 py-20">
                    <FadeInSection>
                        <Header
                            kicker="Study flow"
                            title="Upload → Ask → Practice"
                            subtitle="A clean, simple loop that keeps you moving — and helps you actually remember."
                        />
                    </FadeInSection>

                    <div className="mt-10 grid gap-6 lg:grid-cols-12">
                        <div className="lg:col-span-7 space-y-4">
                            <FadeInSection delay={0.05}>
                                <GlareHoverCard className="bg-gradient-to-b from-sky-500/12 to-white/5">
                                    <StepRow
                                        badge="Step 1"
                                        icon={<Upload className="h-5 w-5" />}
                                        title="Upload your material"
                                        desc="Drop PDFs, notes, or scanned pages. Everything stays organized in your library."
                                    />
                                </GlareHoverCard>
                            </FadeInSection>

                            <FadeInSection delay={0.1}>
                                <GlareHoverCard className="bg-gradient-to-b from-violet-500/12 to-white/5">
                                    <StepRow
                                        badge="Step 2"
                                        icon={<MousePointerClick className="h-5 w-5" />}
                                        title="Ask questions while reading"
                                        desc="Chat beside the page. Get simple explanations or deep answers when needed."
                                    />
                                </GlareHoverCard>
                            </FadeInSection>

                            <FadeInSection delay={0.15}>
                                <GlareHoverCard className="bg-gradient-to-b from-cyan-400/12 to-white/5">
                                    <StepRow
                                        badge="Step 3"
                                        icon={<Zap className="h-5 w-5" />}
                                        title="Generate notes + practice instantly"
                                        desc="Turn any chapter into clean notes, flashcards, and quizzes in one click — then track weak spots."
                                    />
                                </GlareHoverCard>
                            </FadeInSection>

                            <FadeInSection delay={0.2}>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <BulletCard
                                        icon={<Quote className="h-4 w-4" />}
                                        title="Sources included"
                                        desc="Answers point back to the page."
                                    />
                                    <BulletCard
                                        icon={<CheckCircle2 className="h-4 w-4" />}
                                        title="Explain simply"
                                        desc="Switch to easy mode anytime."
                                    />
                                </div>
                            </FadeInSection>
                        </div>

                        {/* Right: StarBorder Preview */}
                        <div className="lg:col-span-5">
                            <FadeInSection delay={0.08}>
                                <StarBorderCard>
                                    <div className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm font-semibold">Study preview</div>
                                            <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-white/70">
                        Sources included
                      </span>
                                        </div>

                                        <div className="mt-5 space-y-3">
                                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                                <div className="text-xs text-white/60">You</div>
                                                <div className="mt-1 text-sm text-white/90">
                                                    Explain this simply, then test me.
                                                </div>
                                            </div>

                                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                                <div className="text-xs text-white/60">Lexaro</div>
                                                <div className="mt-1 text-sm text-white/90">
                                                    Here’s the simple version, plus a quick quiz. Want flashcards too?
                                                </div>

                                                <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-white/70">
                            Notes · page 3
                          </span>
                                                    <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-white/70">
                            PDF · page 12
                          </span>
                                                </div>
                                            </div>

                                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                                <div className="text-xs text-white/60">Quick quiz</div>
                                                <div className="mt-1 text-sm text-white/90">
                                                    1) Main idea? 2) Example? 3) One tricky question.
                                                </div>
                                            </div>

                                            <div className="mt-4 flex flex-wrap gap-3">
                                                <ShimmerButton href="/get-started" variant="primary">
                                                    Try it free
                                                </ShimmerButton>
                                                <ShimmerButton href="/plans" variant="ghost">
                                                    See plans <ArrowRight className="h-4 w-4" />
                                                </ShimmerButton>
                                            </div>
                                        </div>
                                    </div>
                                </StarBorderCard>
                            </FadeInSection>
                        </div>
                    </div>
                </div>
            </FluidGlassSection>

            {/* Voice previews — ✅ StarBorder wraps Voice gallery already */}
            <FluidGlassSection tone="violet">
                <div className="mx-auto max-w-6xl px-6 py-20">
                    <FadeInSection>
                        <Header
                            kicker="Lexaro Voice"
                            title="Try the voices right now"
                            subtitle="Tap a voice and hear it instantly. Perfect for studying, reading support, and content creation."
                        />
                    </FadeInSection>

                    <div className="mt-10 grid gap-6 lg:grid-cols-12">
                        {/* ✅ Voice gallery stays StarBorderCard */}
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

                        {/* ✅ Optional: star border on the 3 right cards too (requested: "voice preview") */}
                        <div className="lg:col-span-5 space-y-6">
                            <FadeInSection delay={0.12}>
                                <StarBorderCard>
                                    <div className="p-5">
                                        <GlareHoverCard className="bg-gradient-to-b from-violet-500/12 to-white/5">
                                            <div className="text-lg font-semibold">Study on the go</div>
                                            <p className="mt-2 text-white/70">
                                                Turn chapters into audio and keep learning anywhere.
                                            </p>
                                        </GlareHoverCard>
                                    </div>
                                </StarBorderCard>
                            </FadeInSection>

                            <FadeInSection delay={0.16}>
                                <StarBorderCard>
                                    <div className="p-5">
                                        <GlareHoverCard className="bg-gradient-to-b from-sky-500/12 to-white/5">
                                            <div className="text-lg font-semibold">Works with translation</div>
                                            <p className="mt-2 text-white/70">
                                                Translate a section, then listen — great for bilingual learners.
                                            </p>
                                        </GlareHoverCard>
                                    </div>
                                </StarBorderCard>
                            </FadeInSection>

                            <FadeInSection delay={0.2}>
                                <StarBorderCard>
                                    <div className="p-5">
                                        <GlareHoverCard className="bg-gradient-to-b from-cyan-400/12 to-white/5">
                                            <div className="text-lg font-semibold">Clean and simple</div>
                                            <p className="mt-2 text-white/70">
                                                No setup. Tap a voice, hit play, done.
                                            </p>
                                        </GlareHoverCard>
                                    </div>
                                </StarBorderCard>
                            </FadeInSection>
                        </div>
                    </div>
                </div>
            </FluidGlassSection>

            {/* CTA + FAQ */}
            <section className="relative overflow-hidden">
                <FloatingLinesBackground />
                <div className="relative z-10 mx-auto max-w-6xl px-6 py-20">
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

function Pill({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
      {icon}
            {text}
    </span>
    );
}

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

function CardTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                {icon}
            </div>
            <div className="text-lg font-semibold">{title}</div>
        </div>
    );
}

function MiniStat({
                      icon,
                      title,
                      desc,
                  }: {
    icon: React.ReactNode;
    title: string;
    desc: string;
}) {
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

function StepRow({
                     badge,
                     icon,
                     title,
                     desc,
                 }: {
    badge: string;
    icon: React.ReactNode;
    title: string;
    desc: string;
}) {
    return (
        <div className="p-6">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                        {icon}
                    </div>

                    <div>
                        <div className="text-lg font-semibold">{title}</div>
                        <p className="mt-2 text-white/70">{desc}</p>
                    </div>
                </div>

                <span className="shrink-0 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-white/70">
          {badge}
        </span>
            </div>
        </div>
    );
}

function BulletCard({
                        icon,
                        title,
                        desc,
                    }: {
    icon: React.ReactNode;
    title: string;
    desc: string;
}) {
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
