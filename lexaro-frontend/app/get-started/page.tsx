"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    // content
    BookOpen,
    FileText,
    Newspaper,
    Mail,
    GraduationCap,
    PenLine,
    Bot,
    Plus,
    // goals
    Rocket,
    Headphones,
    Target,
    Brain,
    Lightbulb,
    // devices
    Smartphone,
    Tablet,
    Monitor,
    // times
    Briefcase,
    Car,
    Sparkles,
    Dumbbell,
    Moon,
    // misc
    Check,
} from "lucide-react";

import VoiceStep, { VoiceId } from "@/components/onboarding/VoiceStep";

type Choice = { id: string; label: string; Icon: React.FC<React.SVGProps<SVGSVGElement>> };

const STEP_KEYS = ["content", "goals", "devices", "times", "voice"] as const;
const TOTAL_STEPS = STEP_KEYS.length;

const CONTENT_CHOICES: Choice[] = [
    { id: "books", label: "Books", Icon: BookOpen },
    { id: "documents", label: "Documents", Icon: FileText },
    { id: "articles", label: "Articles & stories", Icon: Newspaper },
    { id: "emails", label: "Emails", Icon: Mail },
    { id: "academic", label: "Academic materials", Icon: GraduationCap },
    { id: "writing", label: "My own writing", Icon: PenLine },
    { id: "chatbots", label: "AI chatbots", Icon: Bot },
    { id: "other", label: "Other", Icon: Plus },
];

const GOAL_CHOICES: Choice[] = [
    { id: "productive", label: "Be more productive", Icon: Rocket },
    { id: "on-the-go", label: "Listen on the go", Icon: Headphones },
    { id: "focused", label: "Stay focused and engaged", Icon: Target },
    { id: "easier", label: "Make studying easier", Icon: Brain },
    { id: "learn", label: "Learn something new", Icon: Lightbulb },
    { id: "other", label: "Other", Icon: Plus },
];

const DEVICE_CHOICES: Choice[] = [
    { id: "phone", label: "Smartphone", Icon: Smartphone },
    { id: "tablet", label: "Tablet", Icon: Tablet },
    { id: "desktop", label: "Desktop/Laptop", Icon: Monitor },
    { id: "other", label: "Other", Icon: Plus },
];

const TIME_CHOICES: Choice[] = [
    { id: "work", label: "While working or studying", Icon: Briefcase },
    { id: "commute", label: "During commute", Icon: Car },
    { id: "chores", label: "While doing chores/cleaning", Icon: Sparkles },
    { id: "exercise", label: "While exercising", Icon: Dumbbell },
    { id: "relax", label: "To relax before bed", Icon: Moon },
    { id: "other", label: "Other", Icon: Plus },
];

function stepTitle(step: number) {
    switch (STEP_KEYS[step]) {
        case "content":
            return "What are you studying with Lexaro?";
        case "goals":
            return "What do you want Lexaro to help you improve?";
        case "devices":
            return "What device will you use most?";
        case "times":
            return "When do you usually study?";
        case "voice":
            return "A few quick picks (optional)";
    }
}

function stepSubtitle(step: number) {
    switch (STEP_KEYS[step]) {
        case "content":
            return "This helps Lexaro adapt the way it explains and structures study material.";
        case "goals":
            return "We’ll emphasize the tools that match your goals: notes, quizzes, flashcards, and voice.";
        case "devices":
            return "So the experience feels smooth on what you actually use.";
        case "times":
            return "So sessions can match your schedule and attention window.";
        case "voice":
            return "Choose what matters most to you so your first experience feels tailored.";
    }
}

function choicesFor(step: number): Choice[] {
    switch (STEP_KEYS[step]) {
        case "content":
            return CONTENT_CHOICES;
        case "goals":
            return GOAL_CHOICES;
        case "devices":
            return DEVICE_CHOICES;
        case "times":
            return TIME_CHOICES;
        case "voice":
            return []; // custom UI handled by <VoiceStep/>
    }
}

export default function GetStartedPage() {
    const router = useRouter();

    const [step, setStep] = useState(0);
    const [shake, setShake] = useState(false);
    const [selected, setSelected] = useState<Record<string, Set<string>>>({
        content: new Set(),
        goals: new Set(),
        devices: new Set(),
        times: new Set(),
        voice: new Set(), // used by VoiceStep (optional)
    });

    const title = stepTitle(step);
    const subtitle = stepSubtitle(step);
    const items = useMemo(() => choicesFor(step), [step]);
    const key = STEP_KEYS[step];
    const isLast = step === TOTAL_STEPS - 1;

    const toggle = (id: string) => {
        const next = new Set(selected[key]);
        next.has(id) ? next.delete(id) : next.add(id);
        setSelected((s) => ({ ...s, [key]: next }));
    };

    // last step optional
    const hasSelection = key === "voice" ? true : selected[key].size > 0;

    const onContinue = () => {
        if (!hasSelection) {
            setShake(true);
            setTimeout(() => setShake(false), 420);
            return;
        }
        if (isLast) router.push("/trial-offer");
        else setStep((s) => s + 1);
    };

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Enter") onContinue();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, hasSelection]);

    const continueLabel = isLast ? "Start trial" : "Continue";

    return (
        <main className="min-h-screen bg-black text-white pb-28">
            {/* Centered brand (no navbar) */}
            <header className="pt-6">
                <div className="mx-auto flex items-center justify-center gap-3">
                    <Image
                        src="/logo.png"
                        alt="Lexaro"
                        width={28}
                        height={28}
                        className="h-8 w-8"
                        priority
                    />
                    <span className="text-lg font-semibold">Lexaro</span>
                </div>
            </header>

            {/* Body */}
            <section className="section mt-10 max-w-4xl">
                <p className="kicker text-white/60 text-center">LET’S TAILOR LEXARO</p>
                <h1 className="h1 mt-2 text-center">{title}</h1>
                <p className="p mt-3 text-white/70 text-center">
                    {subtitle} <span className="text-white/80">Choose all that apply.</span>
                </p>

                {/* Step content */}
                <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <AnimatePresence mode="wait">
                        {key !== "voice" ? (
                            <motion.div
                                key={`grid-${step}`}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.2 }}
                                className="contents"
                            >
                                {items.map(({ id, label, Icon }) => {
                                    const active = selected[key].has(id);
                                    return (
                                        <motion.button
                                            key={id}
                                            onClick={() => toggle(id)}
                                            whileTap={{ scale: 0.985 }}
                                            className={[
                                                "group relative flex items-center justify-between gap-4",
                                                "rounded-[1.25rem] border border-white/10 bg-[var(--card)]/95",
                                                "px-5 py-5 min-h-[92px]",
                                                "transition-colors hover:bg-white/[0.06] focus:outline-none",
                                                active ? "ring-1 ring-accent/50" : "",
                                            ].join(" ")}
                                        >
                                            <div className="flex items-center gap-4">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
                          <Icon className="h-5 w-5 text-white/80" strokeWidth={1.75} />
                        </span>
                                                <span className="text-base text-white/90">{label}</span>
                                            </div>

                                            <span
                                                className={[
                                                    "inline-flex h-6 w-6 items-center justify-center rounded-md border transition",
                                                    active ? "border-accent bg-accent text-white" : "border-white/25 text-white/40",
                                                ].join(" ")}
                                                aria-hidden
                                            >
                        {active ? <Check className="h-4 w-4" /> : null}
                      </span>

                                            <span className="pointer-events-none absolute inset-0 rounded-[1.25rem] opacity-0 transition-opacity group-hover:opacity-100 ring-1 ring-white/5" />
                                        </motion.button>
                                    );
                                })}
                            </motion.div>
                        ) : (
                            <VoiceStep
                                selected={selected.voice as Set<VoiceId>}
                                onChange={(next) => setSelected((s) => ({ ...s, voice: next }))}
                            />
                        )}
                    </AnimatePresence>
                </div>

                {/* Actions */}
                <div className="mt-8 flex items-center justify-center gap-3">
                    {step > 0 && (
                        <button
                            onClick={() => setStep((s) => Math.max(0, s - 1))}
                            className="rounded-xl border border-white/20 px-5 py-2 text-sm font-semibold hover:bg-white/5"
                        >
                            Back
                        </button>
                    )}

                    <motion.button
                        onClick={onContinue}
                        aria-disabled={!hasSelection}
                        className={[
                            "btn-accent",
                            !hasSelection ? "opacity-40 cursor-not-allowed hover:shadow-none active:scale-100" : "",
                        ].join(" ")}
                        animate={shake ? { x: [-7, 7, -5, 5, -2, 0] } : { x: 0 }}
                        transition={{ duration: 0.42 }}
                    >
                        {continueLabel}
                    </motion.button>
                </div>
            </section>

            {/* Centered footer */}
            <footer className="mt-16 py-10 text-center text-sm text-white/60">
                © {new Date().getFullYear()} Lexaro. All rights reserved.
            </footer>

            {/* Fixed bottom progress */}
            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/60 backdrop-blur-sm">
                <div className="section py-3">
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
                        <motion.div
                            className="absolute inset-y-0 left-0 rounded-full bg-accent"
                            initial={{ width: "0%" }}
                            animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
                            transition={{ type: "spring", stiffness: 220, damping: 28, mass: 0.4 }}
                        />
                    </div>
                    <div className="mt-2 text-center text-xs text-white/60">
                        Step {step + 1} of {TOTAL_STEPS}
                    </div>
                </div>
            </div>
        </main>
    );
}
