'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    // content
    BookOpen, FileText, Newspaper, Mail, GraduationCap, PenLine, Bot, Plus,
    // goals
    Rocket, Headphones, Target, Brain, Lightbulb,
    // devices
    Smartphone, Tablet, Monitor,
    // times
    Briefcase, Car, Sparkles, Dumbbell, Moon,
    // misc
    Check, Play, Pause, User, UserRound
} from 'lucide-react';

type Choice = { id: string; label: string; Icon: React.FC<React.SVGProps<SVGSVGElement>> };

const STEP_KEYS = ['content', 'goals', 'devices', 'times', 'voice'] as const;
const TOTAL_STEPS = STEP_KEYS.length;

const CONTENT_CHOICES: Choice[] = [
    { id: 'books',      label: 'Books',                Icon: BookOpen },
    { id: 'documents',  label: 'Documents',            Icon: FileText },
    { id: 'articles',   label: 'Articles & stories',   Icon: Newspaper },
    { id: 'emails',     label: 'Emails',               Icon: Mail },
    { id: 'academic',   label: 'Academic materials',   Icon: GraduationCap },
    { id: 'writing',    label: 'My own writing',       Icon: PenLine },
    { id: 'chatbots',   label: 'AI chatbots',          Icon: Bot },
    { id: 'other',      label: 'Other',                Icon: Plus },
];

const GOAL_CHOICES: Choice[] = [
    { id: 'productive', label: 'Be more productive',       Icon: Rocket },
    { id: 'on-the-go',  label: 'Listen on the go',          Icon: Headphones },
    { id: 'focused',    label: 'Stay focused and engaged',  Icon: Target },
    { id: 'easier',     label: 'Make reading easier',       Icon: Brain },
    { id: 'learn',      label: 'Learn something new',       Icon: Lightbulb },
    { id: 'other',      label: 'Other',                     Icon: Plus },
];

const DEVICE_CHOICES: Choice[] = [
    { id: 'phone',   label: 'Smartphone',     Icon: Smartphone },
    { id: 'tablet',  label: 'Tablet',         Icon: Tablet },
    { id: 'desktop', label: 'Desktop/Laptop', Icon: Monitor },
    { id: 'other',   label: 'Other',          Icon: Plus },
];

const TIME_CHOICES: Choice[] = [
    { id: 'work',     label: 'While working or studying',  Icon: Briefcase },
    { id: 'commute',  label: 'During commute',             Icon: Car },
    { id: 'chores',   label: 'While doing chores/cleaning',Icon: Sparkles },
    { id: 'exercise', label: 'While exercising',           Icon: Dumbbell },
    { id: 'relax',    label: 'To relax before bed',        Icon: Moon },
    { id: 'other',    label: 'Other',                      Icon: Plus },
];

function stepTitle(step: number) {
    switch (STEP_KEYS[step]) {
        case 'content': return 'What do you want to listen to?';
        case 'goals':   return 'What would you like to achieve with Lexaro?';
        case 'devices': return 'What device will you use to listen?';
        case 'times':   return 'When do you want to listen?';
        case 'voice':   return 'Choose a starting voice';
    }
}

function choicesFor(step: number): Choice[] {
    switch (STEP_KEYS[step]) {
        case 'content': return CONTENT_CHOICES;
        case 'goals':   return GOAL_CHOICES;
        case 'devices': return DEVICE_CHOICES;
        case 'times':   return TIME_CHOICES;
        case 'voice':   return []; // custom UI below
    }
}

export default function GetStartedPage() {
    const router = useRouter();

    const [step, setStep] = useState(0);
    const [shake, setShake] = useState(false);
    const [selected, setSelected] = useState<Record<string, Set<string>>>({
        content: new Set(),
        goals:   new Set(),
        devices: new Set(),
        times:   new Set(),
        voice:   new Set(),
    });

    // simple "playing" simulation for the preview cards
    const [playingId, setPlayingId] = useState<string | null>(null);

    const title  = stepTitle(step);
    const items  = useMemo(() => choicesFor(step), [step]);
    const key    = STEP_KEYS[step];
    const isLast = step === TOTAL_STEPS - 1;

    const toggle = (id: string) => {
        const next = new Set(selected[key]);
        next.has(id) ? next.delete(id) : next.add(id);
        setSelected((s) => ({ ...s, [key]: next }));
    };

    // Voice step is optional → allow continuing without selection on step 5
    const hasSelection = key === 'voice' ? true : selected[key].size > 0;

    const onContinue = () => {
        if (!hasSelection) {
            setShake(true);
            setTimeout(() => setShake(false), 420);
            return;
        }
        if (isLast) {
            router.push('/trial-offer'); // go straight to the Premium yearly trial funnel
        } else {
            setStep((s) => s + 1);
        }
    };

    // QoL: Enter key continues
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Enter') onContinue(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onContinue, hasSelection, isLast]);

    const progress = ((step + 1) / TOTAL_STEPS) * 100;
    const continueLabel = isLast ? 'Start trial' : 'Continue';

    return (
        <main className="min-h-screen bg-black text-white pb-28">
            {/* Centered brand (no navbar) */}
            <header className="pt-6">
                <div className="mx-auto flex items-center justify-center gap-3">
                    <Image src="/logo.png" alt="Lexaro" width={28} height={28} className="h-8 w-8" priority />
                    <span className="text-lg font-semibold">Lexaro</span>
                </div>
            </header>

            {/* Body */}
            <section className="section mt-10 max-w-4xl">
                <p className="kicker text-white/60 text-center">LET’S TAILOR LEXARO</p>
                <h1 className="h1 mt-2 text-center">{title}</h1>
                <p className="p mt-3 text-white/70 text-center">
                    Your choices won’t limit your experience. <span className="text-white/80">Choose all that apply.</span>
                </p>

                {/* Step content */}
                <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <AnimatePresence mode="wait">
                        {key !== 'voice' ? (
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
                                                'group relative flex items-center justify-between gap-4',
                                                'rounded-[1.25rem] border border-white/10 bg-[var(--card)]/95',
                                                'px-5 py-5 min-h-[92px]',
                                                'transition-colors hover:bg-white/[0.06] focus:outline-none',
                                                active ? 'ring-1 ring-accent/50' : '',
                                            ].join(' ')}
                                        >
                                            <div className="flex items-center gap-4">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
                          <Icon className="h-5 w-5 text-white/80" strokeWidth={1.75} />
                        </span>
                                                <span className="text-base text-white/90">{label}</span>
                                            </div>

                                            <span
                                                className={[
                                                    'inline-flex h-6 w-6 items-center justify-center rounded-md border transition',
                                                    active ? 'border-accent bg-accent text-white' : 'border-white/25 text-white/40',
                                                ].join(' ')}
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
                            <motion.div
                                key={`voice-${step}`}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.2 }}
                                className="col-span-2"
                            >
                                {/* helper text */}
                                <div className="card p-6 mb-6">
                                    <p className="text-white/80">
                                        Preview a few voices (optional). <span className="text-white/90 font-medium">You can change your voices later in the app.</span>
                                    </p>
                                </div>

                                {/* Voice preview layout */}
                                <div className="relative">
                                    {/* Center circle with silhouettes */}
                                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                        <div className="relative h-40 w-40 rounded-full border border-white/10 bg-white/[0.03]">
                                            <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-80">
                                                <User className="h-10 w-10 text-white/70" strokeWidth={1.6} />
                                                <UserRound className="h-10 w-10 text-white/70" strokeWidth={1.6} />
                                            </div>
                                            <div className="absolute -inset-6 rounded-full bg-gradient-to-r from-blue-500/10 via-fuchsia-500/10 to-cyan-500/10 blur-2xl" />
                                        </div>
                                    </div>

                                    {/* 2x2 grid of preview cards */}
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        {[
                                            { id: 'v1', title: 'Warm Female' },
                                            { id: 'v2', title: 'Bright Male' },
                                            { id: 'v3', title: 'Calm Female' },
                                            { id: 'v4', title: 'Deep Male' },
                                        ].map((v, i) => {
                                            const active = selected.voice.has(v.id);
                                            const isPlaying = playingId === v.id;
                                            return (
                                                <motion.div
                                                    key={v.id}
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.05, duration: 0.2 }}
                                                    className={[
                                                        'relative rounded-2xl border border-white/10 bg-[var(--card)]/95 p-5',
                                                        active ? 'ring-1 ring-accent/50' : 'hover:bg-white/[0.06]',
                                                    ].join(' ')}
                                                >
                                                    <div className="mb-3 flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05]">
                                {/* simple glyph */}
                                  {i % 2 === 0 ? (
                                      <User className="h-5 w-5 text-white/80" strokeWidth={1.6} />
                                  ) : (
                                      <UserRound className="h-5 w-5 text-white/80" strokeWidth={1.6} />
                                  )}
                              </span>
                                                            <div className="text-white/90 font-medium">{v.title}</div>
                                                        </div>
                                                        <button
                                                            onClick={() => setSelected((s) => {
                                                                const next = new Set(s.voice);
                                                                next.has(v.id) ? next.delete(v.id) : next.add(v.id);
                                                                return { ...s, voice: next };
                                                            })}
                                                            className={[
                                                                'rounded-md border px-2 py-1 text-xs font-semibold',
                                                                active ? 'border-accent bg-accent text-white' : 'border-white/20 text-white/70 hover:bg-white/5',
                                                            ].join(' ')}
                                                        >
                                                            {active ? 'Selected' : 'Select'}
                                                        </button>
                                                    </div>

                                                    <div className="mt-3 flex items-center justify-center">
                                                        <button
                                                            onClick={() => setPlayingId((p) => (p === v.id ? null : v.id))}
                                                            className={[
                                                                'inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold',
                                                                'bg-white/5 hover:bg-white/10 transition-colors',
                                                            ].join(' ')}
                                                        >
                                                            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                                            {isPlaying ? 'Pause' : 'Play'}
                                                        </button>
                                                    </div>

                                                    {/* hover glow */}
                                                    <span className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity hover:opacity-100 ring-1 ring-white/5" />
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </motion.div>
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
                            'btn-accent',
                            !hasSelection ? 'opacity-40 cursor-not-allowed hover:shadow-none active:scale-100' : '',
                        ].join(' ')}
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

            {/* Fixed bottom progress (animated) */}
            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/60 backdrop-blur-sm">
                <div className="section py-3">
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
                        <motion.div
                            className="absolute inset-y-0 left-0 rounded-full bg-accent"
                            initial={{ width: '0%' }}
                            animate={{ width: `${progress}%` }}
                            transition={{ type: 'spring', stiffness: 220, damping: 28, mass: 0.4 }}
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
