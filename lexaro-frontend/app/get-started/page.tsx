"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    BookOpen,
    FileText,
    GraduationCap,
    Headphones,
    Brain,
    Check,
    Sparkles,
    ChevronRight,
    ScrollText,
    Newspaper,
    Car,
    Dumbbell,
    Home,
    Coffee,
    Briefcase,
    Moon,
    Sun,
    Clock,
    Sunset,
} from "lucide-react";
import {
    IconMessageDots,
    IconCards,
    IconChecklist,
    IconNotes,
    IconHeadphones,
} from "@tabler/icons-react";

/**
 * Step configuration for the onboarding flow.
 */
const STEP_KEYS = ["welcome", "content", "when", "where", "features"] as const;
type StepKey = (typeof STEP_KEYS)[number];
const TOTAL_STEPS = STEP_KEYS.length;

/**
 * Content type choices - what they'll study.
 */
const CONTENT_CHOICES = [
    { id: "textbooks", label: "Textbooks & course materials", Icon: BookOpen },
    { id: "research", label: "Research papers & articles", Icon: Newspaper },
    { id: "notes", label: "Lecture notes & slides", Icon: GraduationCap },
    { id: "legal", label: "Legal or business documents", Icon: ScrollText },
    { id: "other", label: "Other documents", Icon: FileText },
];

/**
 * When choices - when they usually study.
 */
const WHEN_CHOICES = [
    { id: "morning", label: "Morning", desc: "Start the day productive", Icon: Sun },
    { id: "afternoon", label: "Afternoon", desc: "Between classes or meetings", Icon: Clock },
    { id: "evening", label: "Evening", desc: "Wind down with studying", Icon: Sunset },
    { id: "night", label: "Late night", desc: "Night owl sessions", Icon: Moon },
];

/**
 * Where choices - where they plan on listening/studying.
 */
const WHERE_CHOICES = [
    { id: "commute", label: "During commute", desc: "Car, bus, train, or walking", Icon: Car },
    { id: "gym", label: "At the gym", desc: "While working out", Icon: Dumbbell },
    { id: "home", label: "At home", desc: "Desk, couch, or bed", Icon: Home },
    { id: "cafe", label: "Café or library", desc: "Public study spots", Icon: Coffee },
    { id: "work", label: "At work or school", desc: "Between tasks or classes", Icon: Briefcase },
];

/**
 * Feature preferences - what they care about most.
 */
const FEATURE_CHOICES = [
    {
        id: "chat",
        title: "AI Chat with Citations",
        desc: "Ask questions and get answers grounded in your documents",
        Icon: IconMessageDots,
    },
    {
        id: "notes",
        title: "Smart Notes",
        desc: "Auto-generate summaries and study notes",
        Icon: IconNotes,
    },
    {
        id: "flashcards",
        title: "Flashcards",
        desc: "Create decks and drill weak areas",
        Icon: IconCards,
    },
    {
        id: "quizzes",
        title: "Quizzes & Grading",
        desc: "Test yourself and track progress",
        Icon: IconChecklist,
    },
    {
        id: "audio",
        title: "Listen to Documents",
        desc: "Turn any document into natural-sounding audio",
        Icon: IconHeadphones,
    },
];

/**
 * Get step title based on current step.
 */
function stepTitle(step: number): string {
    switch (STEP_KEYS[step]) {
        case "welcome":
            return "Welcome to Lexaro";
        case "content":
            return "What will you study?";
        case "when":
            return "When do you usually study?";
        case "where":
            return "Where do you plan on listening?";
        case "features":
            return "What features interest you most?";
        default:
            return "";
    }
}

/**
 * Get step subtitle based on current step.
 */
function stepSubtitle(step: number): string {
    switch (STEP_KEYS[step]) {
        case "welcome":
            return "Let's personalize your experience in just a few quick steps.";
        case "content":
            return "Select all that apply so we can optimize your experience.";
        case "when":
            return "We'll tailor reminders and suggestions to match your schedule.";
        case "where":
            return "This helps us optimize audio playback for your environment.";
        case "features":
            return "Pick your top priorities and we'll highlight them for you.";
        default:
            return "";
    }
}

export default function GetStartedPage() {
    const router = useRouter();

    const [step, setStep] = useState(0);
    const [shake, setShake] = useState(false);

    const [selected, setSelected] = useState<{
        content: Set<string>;
        when: Set<string>;
        where: Set<string>;
        features: Set<string>;
    }>({
        content: new Set(),
        when: new Set(),
        where: new Set(),
        features: new Set(),
    });

    const title = stepTitle(step);
    const subtitle = stepSubtitle(step);
    const key: StepKey = STEP_KEYS[step];
    const isLast = step === TOTAL_STEPS - 1;
    const isWelcome = key === "welcome";

    /**
     * Check if current step has valid selection.
     */
    const hasSelection = useMemo(() => {
        switch (key) {
            case "welcome":
                return true;
            case "content":
                return selected.content.size > 0;
            case "when":
                return selected.when.size > 0;
            case "where":
                return selected.where.size > 0;
            case "features":
                return true; // Optional step
            default:
                return false;
        }
    }, [key, selected]);

    /**
     * Generic toggle function for any selection set.
     */
    const toggle = (field: "content" | "when" | "where" | "features", id: string) => {
        const next = new Set(selected[field]);
        next.has(id) ? next.delete(id) : next.add(id);
        setSelected((s) => ({ ...s, [field]: next }));
    };

    /**
     * Handle continue button click.
     */
    const onContinue = () => {
        if (!hasSelection) {
            setShake(true);
            setTimeout(() => setShake(false), 420);
            return;
        }

        if (isLast) {
            // Save onboarding data to localStorage
            try {
                const payload = {
                    content: Array.from(selected.content),
                    when: Array.from(selected.when),
                    where: Array.from(selected.where),
                    features: Array.from(selected.features),
                    completedAt: new Date().toISOString(),
                };
                localStorage.setItem("lexaro:onboarding", JSON.stringify(payload));
            } catch {}

            router.push("/signup?from=onboarding");
        } else {
            setStep((s) => s + 1);
        }
    };

    /**
     * Handle keyboard navigation.
     */
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Enter") onContinue();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, hasSelection]);

    const continueLabel = isLast ? "Create account" : isWelcome ? "Get started" : "Continue";

    return (
        <main className="min-h-screen bg-black text-white pb-28">
            {/* Header */}
            <header className="pt-6">
                <div className="mx-auto flex items-center justify-center gap-3">
                    <Image src="/logo.png" alt="Lexaro" width={32} height={32} className="h-8 w-8" priority />
                    <span className="text-lg font-semibold">Lexaro</span>
                </div>
            </header>

            {/* Main content */}
            <section className="mx-auto mt-10 max-w-2xl px-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.25 }}
                    >
                        {/* Step header */}
                        <div className="text-center">
                            {!isWelcome && (
                                <p className="text-xs tracking-[0.2em] text-white/50 uppercase mb-2">
                                    Step {step} of {TOTAL_STEPS - 1}
                                </p>
                            )}
                            <h1 className="text-3xl md:text-4xl font-semibold">{title}</h1>
                            <p className="mt-3 text-white/70 max-w-md mx-auto">{subtitle}</p>
                        </div>

                        {/* Step content */}
                        <div className="mt-10">
                            {/* Welcome step */}
                            {key === "welcome" && (
                                <div className="space-y-6">
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="flex items-start gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center flex-shrink-0">
                                                    <Headphones className="h-5 w-5 text-cyan-400" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-white/90">Listen anywhere</div>
                                                    <div className="text-sm text-white/60">Turn docs into natural audio</div>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center flex-shrink-0">
                                                    <Brain className="h-5 w-5 text-violet-400" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-white/90">Study smarter</div>
                                                    <div className="text-sm text-white/60">AI-powered learning tools</div>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-white/10 flex items-center justify-center flex-shrink-0">
                                                    <Check className="h-5 w-5 text-green-400" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-white/90">Cited answers</div>
                                                    <div className="text-sm text-white/60">Every response linked to source</div>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-white/10 flex items-center justify-center flex-shrink-0">
                                                    <Sparkles className="h-5 w-5 text-amber-400" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-white/90">Track progress</div>
                                                    <div className="text-sm text-white/60">Know what needs work</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-center text-sm text-white/50">
                                        Takes less than a minute to set up
                                    </p>
                                </div>
                            )}

                            {/* Content type selection step */}
                            {key === "content" && (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {CONTENT_CHOICES.map((c) => {
                                        const active = selected.content.has(c.id);
                                        const Icon = c.Icon;
                                        return (
                                            <motion.button
                                                key={c.id}
                                                onClick={() => toggle("content", c.id)}
                                                whileTap={{ scale: 0.98 }}
                                                className={[
                                                    "group relative flex items-center gap-3 text-left",
                                                    "rounded-xl border border-white/10 bg-white/[0.03]",
                                                    "px-4 py-4 transition-all hover:bg-white/[0.05]",
                                                    active ? "ring-1 ring-[var(--accent)]/50 bg-white/[0.05]" : "",
                                                ].join(" ")}
                                            >
                                                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] flex-shrink-0">
                                                    <Icon className="h-5 w-5 text-white/70" />
                                                </span>
                                                <span className="flex-1 text-sm text-white/90">{c.label}</span>
                                                <span
                                                    className={[
                                                        "inline-flex h-5 w-5 items-center justify-center rounded border transition",
                                                        active ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-white/25",
                                                    ].join(" ")}
                                                >
                                                    {active && <Check className="h-3 w-3" />}
                                                </span>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* When do you study step */}
                            {key === "when" && (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {WHEN_CHOICES.map((w) => {
                                        const active = selected.when.has(w.id);
                                        const Icon = w.Icon;
                                        return (
                                            <motion.button
                                                key={w.id}
                                                onClick={() => toggle("when", w.id)}
                                                whileTap={{ scale: 0.98 }}
                                                className={[
                                                    "group relative flex items-center gap-3 text-left",
                                                    "rounded-xl border border-white/10 bg-white/[0.03]",
                                                    "px-4 py-4 transition-all hover:bg-white/[0.05]",
                                                    active ? "ring-1 ring-[var(--accent)]/50 bg-white/[0.05]" : "",
                                                ].join(" ")}
                                            >
                                                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] flex-shrink-0">
                                                    <Icon className="h-5 w-5 text-white/70" />
                                                </span>
                                                <div className="flex-1">
                                                    <div className="text-sm font-medium text-white/90">{w.label}</div>
                                                    <div className="text-xs text-white/50">{w.desc}</div>
                                                </div>
                                                <span
                                                    className={[
                                                        "inline-flex h-5 w-5 items-center justify-center rounded border transition",
                                                        active ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-white/25",
                                                    ].join(" ")}
                                                >
                                                    {active && <Check className="h-3 w-3" />}
                                                </span>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Where do you listen step */}
                            {key === "where" && (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {WHERE_CHOICES.map((w) => {
                                        const active = selected.where.has(w.id);
                                        const Icon = w.Icon;
                                        return (
                                            <motion.button
                                                key={w.id}
                                                onClick={() => toggle("where", w.id)}
                                                whileTap={{ scale: 0.98 }}
                                                className={[
                                                    "group relative flex items-center gap-3 text-left",
                                                    "rounded-xl border border-white/10 bg-white/[0.03]",
                                                    "px-4 py-4 transition-all hover:bg-white/[0.05]",
                                                    active ? "ring-1 ring-[var(--accent)]/50 bg-white/[0.05]" : "",
                                                ].join(" ")}
                                            >
                                                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] flex-shrink-0">
                                                    <Icon className="h-5 w-5 text-white/70" />
                                                </span>
                                                <div className="flex-1">
                                                    <div className="text-sm font-medium text-white/90">{w.label}</div>
                                                    <div className="text-xs text-white/50">{w.desc}</div>
                                                </div>
                                                <span
                                                    className={[
                                                        "inline-flex h-5 w-5 items-center justify-center rounded border transition",
                                                        active ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-white/25",
                                                    ].join(" ")}
                                                >
                                                    {active && <Check className="h-3 w-3" />}
                                                </span>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Feature preferences step */}
                            {key === "features" && (
                                <div className="space-y-4">
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {FEATURE_CHOICES.map((f) => {
                                            const active = selected.features.has(f.id);
                                            const Icon = f.Icon;
                                            return (
                                                <motion.button
                                                    key={f.id}
                                                    onClick={() => toggle("features", f.id)}
                                                    whileTap={{ scale: 0.98 }}
                                                    className={[
                                                        "group relative text-left",
                                                        "rounded-xl border border-white/10 bg-white/[0.03]",
                                                        "p-4 transition-all hover:bg-white/[0.05]",
                                                        active ? "ring-1 ring-[var(--accent)]/50 bg-white/[0.05]" : "",
                                                    ].join(" ")}
                                                >
                                                    <div className="flex items-center justify-between gap-3 mb-2">
                                                        <div className="flex items-center gap-3">
                                                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
                                                                <Icon size={18} className="text-white/70" />
                                                            </span>
                                                            <span className="font-medium text-white/90">{f.title}</span>
                                                        </div>
                                                        <span
                                                            className={[
                                                                "inline-flex h-5 w-5 items-center justify-center rounded border transition",
                                                                active ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-white/25",
                                                            ].join(" ")}
                                                        >
                                                            {active && <Check className="h-3 w-3" />}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-white/60">{f.desc}</p>
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                    <p className="text-center text-xs text-white/50">
                                        You can explore all features anytime. This just helps us personalize your dashboard.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Navigation buttons */}
                        <div className="mt-10 flex items-center justify-center gap-3">
                            {step > 0 && (
                                <button
                                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                                    className="rounded-xl border border-white/20 px-5 py-2.5 text-sm font-medium text-white/80 hover:bg-white/5 transition-colors"
                                >
                                    Back
                                </button>
                            )}

                            <motion.button
                                onClick={onContinue}
                                aria-disabled={!hasSelection}
                                className={[
                                    "inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all",
                                    "bg-[var(--accent)] text-white hover:brightness-110",
                                    !hasSelection ? "opacity-40 cursor-not-allowed" : "",
                                ].join(" ")}
                                animate={shake ? { x: [-7, 7, -5, 5, -2, 0] } : { x: 0 }}
                                transition={{ duration: 0.42 }}
                            >
                                {continueLabel}
                                {!isLast && <ChevronRight className="h-4 w-4" />}
                            </motion.button>
                        </div>

                        {/* Skip link on welcome */}
                        {isWelcome && (
                            <div className="mt-6 text-center">
                                <Link
                                    href="/signup"
                                    className="text-sm text-white/50 hover:text-white/70 transition-colors"
                                >
                                    Already know what you need? Skip to signup
                                </Link>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </section>

            {/* Footer */}
            <footer className="mt-16 text-center text-sm text-white/50">
                Already have an account?{" "}
                <Link href="/login" className="text-white/70 hover:text-white underline underline-offset-2">
                    Log in
                </Link>
            </footer>

            {/* Progress bar (hidden on welcome step) */}
            {!isWelcome && (
                <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/80 backdrop-blur-sm">
                    <div className="mx-auto max-w-2xl px-4 py-3">
                        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                            <motion.div
                                className="absolute inset-y-0 left-0 rounded-full bg-[var(--accent)]"
                                initial={{ width: "0%" }}
                                animate={{ width: `${(step / (TOTAL_STEPS - 1)) * 100}%` }}
                                transition={{ type: "spring", stiffness: 220, damping: 28 }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
