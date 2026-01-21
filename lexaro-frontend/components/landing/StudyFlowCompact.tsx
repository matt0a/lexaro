"use client";

import React from "react";
import StarBorderCard from "@/components/reactbits/StarBorderCard";
import GlareHoverCard from "@/components/reactbits/GlareHoverCard";
import ShimmerButton from "@/components/reactbits/ShimmerButton";
import { BookOpen, Quote, Sparkles, ArrowRight } from "lucide-react";

export default function StudyFlowCompact() {
    return (
        <div className="grid gap-6 lg:grid-cols-12">
            {/* Left: compact “flow” list */}
            <div className="lg:col-span-7 space-y-4">
                <GlareHoverCard className="bg-gradient-to-b from-sky-500/12 to-white/5">
                    <Row
                        icon={<BookOpen className="h-5 w-5" />}
                        title="Ask questions while reading"
                        desc="Open a PDF and chat right beside it — no copy/paste."
                        badge="Step 1"
                    />
                </GlareHoverCard>

                <GlareHoverCard className="bg-gradient-to-b from-violet-500/12 to-white/5">
                    <Row
                        icon={<Quote className="h-5 w-5" />}
                        title="Get answers with page links"
                        desc="Click the source and jump to the exact page so you can trust it."
                        badge="Step 2"
                    />
                </GlareHoverCard>

                <GlareHoverCard className="bg-gradient-to-b from-cyan-400/12 to-white/5">
                    <Row
                        icon={<Sparkles className="h-5 w-5" />}
                        title="Practice in one click"
                        desc="Generate flashcards + quizzes from your chapter and track weak spots."
                        badge="Step 3"
                    />
                </GlareHoverCard>

                <div className="pt-2 flex flex-wrap gap-3">
                    <ShimmerButton href="/get-started" variant="primary">
                        Try it free
                    </ShimmerButton>
                    <ShimmerButton href="/plans" variant="ghost">
                        See pricing <ArrowRight className="h-4 w-4" />
                    </ShimmerButton>
                </div>
            </div>

            {/* Right: mini product preview */}
            <div className="lg:col-span-5">
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
                                    Sure — here’s the simple explanation, plus a quick quiz based on your page.
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
                                    1) What’s the main idea? 2) Give an example. 3) One tricky question.
                                </div>
                            </div>
                        </div>
                    </div>
                </StarBorderCard>
            </div>
        </div>
    );
}

function Row({
                 icon,
                 title,
                 desc,
                 badge,
             }: {
    icon: React.ReactNode;
    title: string;
    desc: string;
    badge: string;
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
