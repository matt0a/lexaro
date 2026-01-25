"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import {
    IconMessageDots,
    IconCards,
    IconChecklist,
    IconNotes,
} from "@tabler/icons-react";

export type VoiceId = "v1" | "v2" | "v3" | "v4";

export type VoiceStepProps = {
    /** currently selected ids (kept as-is so you don't need to change onboarding wiring) */
    selected: Set<VoiceId>;
    /** called whenever selection changes */
    onChange: (next: Set<VoiceId>) => void;
};

function cn(...classes: Array<string | undefined | false | null>) {
    return classes.filter(Boolean).join(" ");
}

/**
 * Quick personalization picks (no audio / no storage).
 * This keeps your existing "voice" step wiring but makes it relevant to Lexaro.
 */
const PICKS: Array<{
    id: VoiceId;
    title: string;
    desc: string;
    bullets: string[];
    Icon: React.ComponentType<{ className?: string; size?: number }>;
}> = [
    {
        id: "v1",
        title: "Citations + explanations",
        desc: "Get doc-grounded answers with page citations so you can verify instantly.",
        bullets: ["Page citations", "Simple → deep explanations", "Turn answers into practice"],
        Icon: IconMessageDots,
    },
    {
        id: "v2",
        title: "Notes + summaries",
        desc: "Turn chapters into clean notes that make review fast and structured.",
        bullets: ["Outline / Cornell / detailed", "Exam-style summary sheets", "Study-ready formatting"],
        Icon: IconNotes,
    },
    {
        id: "v3",
        title: "Flashcards",
        desc: "Generate decks from your material and drill the weak parts consistently.",
        bullets: ["Definition / Q&A / cloze", "Quick review sessions", "Weak-topic reinforcement"],
        Icon: IconCards,
    },
    {
        id: "v4",
        title: "Quizzes + grading",
        desc: "Attempt → grade → improve. The fastest way to level up for real exams.",
        bullets: ["Difficulty-based quizzes", "Why you missed it", "Next steps + retakes"],
        Icon: IconChecklist,
    },
];

export default function VoiceStep({ selected, onChange }: VoiceStepProps) {
    const togglePick = (id: VoiceId) => {
        const next = new Set(selected);
        next.has(id) ? next.delete(id) : next.add(id);
        onChange(next);
    };

    return (
        <motion.div
            key="voice-step"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="col-span-2"
        >
            {/* Intro copy (clean — no “this won’t change anything” messaging) */}
            <div className="card p-6 mb-6">
                <div className="text-white/90 font-semibold text-lg">
                    A few quick picks
                </div>
                <p className="mt-2 text-white/70 text-sm">
                    Choose what you care about most so Lexaro can tailor your first experience.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {PICKS.map((p, i) => {
                    const active = selected.has(p.id);
                    const Icon = p.Icon;

                    return (
                        <motion.button
                            key={p.id}
                            type="button"
                            onClick={() => togglePick(p.id)}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05, duration: 0.2 }}
                            className={cn(
                                "text-left relative rounded-2xl border p-5 transition-colors",
                                "border-white/10 bg-[var(--card)]/95 hover:bg-white/[0.06]",
                                active && "ring-1 ring-accent/50"
                            )}
                        >
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05]">
                    <Icon size={20} className="text-white/80" />
                  </span>
                                    <div className="text-white/90 font-semibold">{p.title}</div>
                                </div>

                                <span
                                    className={cn(
                                        "inline-flex h-6 w-6 items-center justify-center rounded-md border transition",
                                        active
                                            ? "border-accent bg-accent text-white"
                                            : "border-white/25 text-white/40"
                                    )}
                                    aria-hidden
                                >
                  {active ? <Check className="h-4 w-4" /> : null}
                </span>
                            </div>

                            <p className="text-sm text-white/70">{p.desc}</p>

                            <div className="mt-4 grid gap-2">
                                {p.bullets.map((b) => (
                                    <div
                                        key={b}
                                        className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/70"
                                    >
                                        {b}
                                    </div>
                                ))}
                            </div>

                            <span className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity hover:opacity-100 ring-1 ring-white/5" />
                        </motion.button>
                    );
                })}
            </div>

            <div className="mt-5 text-xs text-white/55">
                You can change these anytime later.
            </div>
        </motion.div>
    );
}
