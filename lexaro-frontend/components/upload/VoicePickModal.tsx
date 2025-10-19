'use client';
import { useEffect, useRef, useState } from 'react';
import { X, Play, Pause, User, UserRound } from 'lucide-react';

export type PickedVoice = { voiceId: string; title: string };

type Props = {
    open: boolean;
    onClose: () => void;
    onPick: (picked: PickedVoice) => void;
    // if you want to auto-highlight a previous choice:
    initialVoiceId?: string | null;
};

/** Hard-coded Speechify voices you already preview in onboarding */
const SPEECHIFY_CHOICES = [
    { voiceId: 'kristy', title: 'Warm Female', preview: '/audio/onboarding/onboarding_kristy.mp3', Glyph: User },
    { voiceId: 'mason',  title: 'Bright Male', preview: '/audio/onboarding/onboarding_mason.mp3',  Glyph: UserRound },
    { voiceId: 'harper', title: 'Calm Female',  preview: '/audio/onboarding/onboarding_harper.mp3', Glyph: User },
    { voiceId: 'alloy',  title: 'Deep Male',    preview: '/audio/onboarding/onboarding_alloy.mp3',  Glyph: UserRound },
] as const;

export default function VoicePickModal({ open, onClose, onPick, initialVoiceId }: Props) {
    const [playing, setPlaying] = useState<string | null>(null);
    const audio = useRef<Record<string, HTMLAudioElement>>({});

    useEffect(() => {
        if (!open) {
            // stop all audio when closing
            Object.values(audio.current).forEach(a => { try { a.pause(); a.currentTime = 0; } catch {} });
            setPlaying(null);
        }
    }, [open]);

    if (!open) return null;

    const togglePlay = (id: string, src: string) => {
        if (!audio.current[id]) {
            const a = new Audio(src);
            a.preload = 'auto';
            a.addEventListener('ended', () => setPlaying(p => (p === id ? null : p)));
            audio.current[id] = a;
        }
        // pause all others
        Object.entries(audio.current).forEach(([k, a]) => {
            if (k !== id) { try { a.pause(); a.currentTime = 0; } catch {} }
        });

        const a = audio.current[id];
        if (playing === id && !a.paused) {
            a.pause();
            setPlaying(null);
        } else {
            a.currentTime = 0;
            a.play().catch(() => {});
            setPlaying(id);
        }
    };

    return (
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/70" onClick={onClose} />
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-black shadow-2xl">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                        <h3 className="text-lg font-semibold">Choose a voice</h3>
                        <button onClick={onClose} className="rounded-md p-1 hover:bg-white/5">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="px-5 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {SPEECHIFY_CHOICES.map((v, i) => {
                            const isInitial = initialVoiceId && initialVoiceId === v.voiceId;
                            const isPlaying = playing === v.voiceId;
                            const Glyph = v.Glyph;
                            return (
                                <div
                                    key={v.voiceId}
                                    className={[
                                        'rounded-2xl border border-white/10 bg-white/[0.03] p-5',
                                        isInitial ? 'ring-1 ring-accent/50' : 'hover:bg-white/[0.06]',
                                    ].join(' ')}
                                >
                                    <div className="mb-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05]">
                        <Glyph className="h-5 w-5 text-white/80" />
                      </span>
                                            <div className="text-white/90 font-medium">{v.title}</div>
                                        </div>
                                        <button
                                            onClick={() => onPick({ voiceId: v.voiceId, title: v.title })}
                                            className="rounded-md border px-2 py-1 text-xs font-semibold border-accent bg-accent text-white"
                                        >
                                            Use
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-center">
                                        <button
                                            onClick={() => togglePlay(v.voiceId, v.preview)}
                                            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold bg-white/5 hover:bg-white/10 transition-colors"
                                        >
                                            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                            {isPlaying ? 'Pause' : 'Play'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="px-5 pb-5">
                        <button onClick={onClose} className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
