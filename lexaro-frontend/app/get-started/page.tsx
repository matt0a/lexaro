'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
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
    Check
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
        case 'voice':   return [];
    }
}

export default function GetStartedPage() {
    const router = useRouter();

    const [step, setStep] = useState(0);
    const [shake, setShake] = useState(false);               // ← for the nudge animation
    const [selected, setSelected] = useState<Record<string, Set<string>>>({
        content: new Set(),
        goals:   new Set(),
        devices: new Set(),
        times:   new Set(),
        voice:   new Set(),
    });

    const title  = stepTitle(step);
    const items  = useMemo(() => choicesFor(step), [step]);
    const key    = STEP_KEYS[step];
    const isLast = step === TOTAL_STEPS - 1;

    const toggle = (id: string) => {
        const next = new Set(selected[key]);
        next.has(id) ? next.delete(id) : next.add(id);
        setSelected((s) => ({ ...s, [key]: next }));
    };

    const hasSelection = selected[key].size > 0;

    const onContinue = () => {
        if (!hasSelection) {
            // trigger a friendly shake if nothing chosen
            setShake(true);
            setTimeout(() => setShake(false), 420);
            return;
        }
        if (isLast) router.push('/signup');
        else setStep((s) => s + 1);
    };

    const progress = ((step + 1) / TOTAL_STEPS) * 100;

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
                                            whileTap={{ scale: 0.985 }}                 // click micro-interaction
                                            className={[
                                                'group relative flex items-center justify-between gap-4',
                                                'rounded-[1.25rem] border border-white/10 bg-[var(--card)]/95',
                                                'px-5 py-5 min-h-[92px]',                  // bigger boxes
                                                'transition-colors hover:bg-white/[0.06] focus:outline-none',
                                                active ? 'ring-1 ring-accent/50' : '',
                                            ].join(' ')}
                                        >
                                            <div className="flex items-center gap-4">
                                                {/* minimal icon */}
                                                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
                          <Icon className="h-5 w-5 text-white/80" strokeWidth={1.75} />
                        </span>
                                                <span className="text-base text-white/90">{label}</span>
                                            </div>

                                            {/* check badge */}
                                            <span
                                                className={[
                                                    'inline-flex h-6 w-6 items-center justify-center rounded-md border transition',
                                                    active
                                                        ? 'border-accent bg-accent text-white'
                                                        : 'border-white/25 text-white/40',
                                                ].join(' ')}
                                                aria-hidden
                                            >
                        {active ? <Check className="h-4 w-4" /> : null}
                      </span>

                                            {/* subtle hover glow */}
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
                                <div className="card p-6">
                                    <p className="text-white/80">
                                        (Optional) Pick a voice on the next screen, or continue to create your
                                        account. You can choose voices later in the app.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Actions */}
                <div className="mt-8 flex items-center justify-center">
                    <motion.button
                        onClick={onContinue}
                        aria-disabled={!hasSelection}
                        className={[
                            'btn-accent',
                            !hasSelection ? 'opacity-40 cursor-not-allowed hover:shadow-none active:scale-100' : '',
                        ].join(' ')}
                        animate={shake ? { x: [-7, 7, -5, 5, -2, 0] } : { x: 0 }}   // ← shake when invalid
                        transition={{ duration: 0.42 }}
                    >
                        Continue
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
