'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, User, UserRound } from 'lucide-react';

export type VoiceId = 'v1' | 'v2' | 'v3' | 'v4';

export type VoiceStepProps = {
    /** currently selected voice ids (multi-select allowed) */
    selected: Set<VoiceId>;
    /** called whenever selection changes */
    onChange: (next: Set<VoiceId>) => void;
};

/** One preview + one voice line per card. Update paths if needed. */
const VOICE_PREVIEWS: Array<{
    id: VoiceId;
    title: string;
    line: string;
    audio: string;
    Glyph: typeof User;
}> = [
    {
        id: 'v1',
        title: 'Kristy',
        line:
            'Hi, I’m Kristy. I keep things warm and clear, perfect for everyday docs, notes and summaries.',
        audio: '/audio/onboarding/onboarding_kristy.mp3',
        Glyph: User,
    },
    {
        id: 'v2',
        title: 'Mason',
        line:
            'I’m Mason. Calm and confident, tuned for presentations, proposals and executive summaries.',
        audio: '/audio/onboarding/onboarding_mason.mp3',
        Glyph: UserRound,
    },
    {
        id: 'v3',
        title: 'Harper',
        line:
            'Hey there, I’m Harper. Conversational and engaging, ideal for blogs, articles and walkthroughs.',
        audio: '/audio/onboarding/onboarding_harper.mp3',
        Glyph: User,
    },
    {
        id: 'v4',
        title: 'Alloy',
        line:
            'Hello, I’m Alloy. Precise and steady, great for technical guides, reports and instructions.',
        audio: '/audio/onboarding/onboarding_alloy.mp3',
        Glyph: UserRound,
    },
];

export default function VoiceStep({ selected, onChange }: VoiceStepProps) {
    // ---- AUDIO state (SSR-safe) ----
    const [isClient, setIsClient] = useState(false);
    const [playingId, setPlayingId] = useState<VoiceId | null>(null);
    const audioMapRef = useRef<Record<string, HTMLAudioElement>>({});

    useEffect(() => {
        setIsClient(true);
        return () => {
            Object.values(audioMapRef.current).forEach((a) => {
                try {
                    a.pause();
                } catch {}
            });
            audioMapRef.current = {};
        };
    }, []);

    const ensureAudio = (id: string, src: string) => {
        if (!isClient) return undefined; // SSR guard
        if (!audioMapRef.current[id]) {
            try {
                const a = new Audio(src);
                a.preload = 'auto';
                a.addEventListener('ended', () =>
                    setPlayingId((cur) => (cur === id ? null : (cur as VoiceId)))
                );
                audioMapRef.current[id] = a;
            } catch {
                return undefined;
            }
        }
        return audioMapRef.current[id];
    };

    const togglePlay = (id: VoiceId, src: string) => {
        const audio = ensureAudio(id, src);
        if (!audio) return;

        // stop others
        Object.entries(audioMapRef.current).forEach(([vid, el]) => {
            if (vid !== id) {
                try {
                    el.pause();
                    el.currentTime = 0;
                } catch {}
            }
        });

        if (playingId === id && !audio.paused) {
            audio.pause();
            setPlayingId(null);
        } else {
            try {
                audio.src = src; // reset if switching files later
                audio.currentTime = 0;
                audio.play();
                setPlayingId(id);
            } catch {
                /* ignore */
            }
        }
    };
    // --------------------------------

    const onToggleSelect = (id: VoiceId) => {
        const next = new Set(selected);
        next.has(id) ? next.delete(id) : next.add(id);
        localStorage.setItem('onboarding.voice', Array.from(next)[0] ?? '');
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
            {/* helper text (keeps your styling) */}
            <div className="card p-6 mb-6">
                <p className="text-white/80">
                    Preview a few voices (optional).{' '}
                    <span className="text-white/90 font-medium">
            You can change your voices later in the app.
          </span>
                </p>
            </div>

            {/* Voice preview layout — same 2x2 grid + subtle hover ring */}
            <div className="relative">
                {/* center silhouettes & glow */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="relative h-40 w-40 rounded-full border border-white/10 bg-white/[0.03]">
                        <div className="absolute -inset-6 rounded-full bg-gradient-to-r from-blue-500/10 via-fuchsia-500/10 to-cyan-500/10 blur-2xl" />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {VOICE_PREVIEWS.map((v, i) => {
                        const active = selected.has(v.id);
                        const isPlaying = playingId === v.id;
                        const Glyph = v.Glyph;

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
                      <Glyph className="h-5 w-5 text-white/80" strokeWidth={1.6} />
                    </span>
                                        <div className="text-white/90 font-medium">{v.title}</div>
                                    </div>
                                    <button
                                        onClick={() => onToggleSelect(v.id)}
                                        className={[
                                            'rounded-md border px-2 py-1 text-xs font-semibold',
                                            active
                                                ? 'border-accent bg-accent text-white'
                                                : 'border-white/20 text-white/70 hover:bg-white/5',
                                        ].join(' ')}
                                    >
                                        {active ? 'Selected' : 'Select'}
                                    </button>
                                </div>

                                {/* Voice line */}
                                <p className="text-sm text-white/70 mb-3">{v.line}</p>

                                <div className="mt-3 flex items-center justify-center">
                                    <button
                                        onClick={() => togglePlay(v.id, v.audio)}
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
    );
}
