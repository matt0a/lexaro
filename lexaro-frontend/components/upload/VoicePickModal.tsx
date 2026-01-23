"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X, Play, Pause, User, UserRound, Sparkles } from "lucide-react";

export type PickedVoice = { voiceId: string; title: string };

type Props = {
    open: boolean;
    onClose: () => void;
    onPick: (picked: PickedVoice) => void;
    initialVoiceId?: string | null;
};

function cn(...classes: Array<string | undefined | false | null>) {
    return classes.filter(Boolean).join(" ");
}

function prefersReducedMotion() {
    if (typeof window === "undefined") return false;
    return !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
}

/** Hard-coded Speechify voices you already preview in onboarding */
const SPEECHIFY_CHOICES = [
    { voiceId: "kristy", title: "Warm Female", preview: "/audio/onboarding/onboarding_kristy.mp3", Glyph: User },
    { voiceId: "mason", title: "Bright Male", preview: "/audio/onboarding/onboarding_mason.mp3", Glyph: UserRound },
    { voiceId: "harper", title: "Calm Female", preview: "/audio/onboarding/onboarding_harper.mp3", Glyph: User },
    { voiceId: "alloy", title: "Deep Male", preview: "/audio/onboarding/onboarding_alloy.mp3", Glyph: UserRound },
] as const;

export default function VoicePickModal({ open, onClose, onPick, initialVoiceId }: Props) {
    const [playing, setPlaying] = useState<string | null>(null);
    const audio = useRef<Record<string, HTMLAudioElement>>({});
    const [mounted, setMounted] = useState(false);
    const reduceMotion = useMemo(() => prefersReducedMotion(), []);

    useEffect(() => {
        if (!open) return;
        setMounted(false);
        const raf = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(raf);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    useEffect(() => {
        if (!open) {
            Object.values(audio.current).forEach((a) => {
                try {
                    a.pause();
                    a.currentTime = 0;
                } catch {}
            });
            setPlaying(null);
        }
    }, [open]);

    if (!open) return null;

    const togglePlay = (id: string, src: string) => {
        if (!audio.current[id]) {
            const a = new Audio(src);
            a.preload = "auto";
            a.addEventListener("ended", () => setPlaying((p) => (p === id ? null : p)));
            audio.current[id] = a;
        }

        Object.entries(audio.current).forEach(([k, a]) => {
            if (k !== id) {
                try {
                    a.pause();
                    a.currentTime = 0;
                } catch {}
            }
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
        <div className="fixed inset-0 z-[60]">
            <div
                className={cn(
                    "absolute inset-0 bg-black/60 backdrop-blur-[6px] transition-opacity duration-200",
                    mounted ? "opacity-100" : "opacity-0"
                )}
                onClick={onClose}
            />

            <div className="absolute inset-0 flex items-center justify-center p-4" onClick={onClose}>
                <div
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                        "w-full max-w-3xl overflow-hidden",
                        "rounded-3xl border border-white/10 bg-black/70 backdrop-blur-xl",
                        "shadow-[0_30px_120px_rgba(0,0,0,.75)]",
                        "transition-all duration-200 ease-out will-change-transform",
                        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
                        reduceMotion ? "scale-100" : mounted ? "scale-100" : "scale-[0.98]"
                    )}
                >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-white/10">
                        <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-2xl border border-white/10 bg-white/[0.06] grid place-items-center">
                                <Sparkles className="h-5 w-5 text-white/80" />
                            </div>
                            <div>
                                <div className="text-sm tracking-[0.22em] uppercase text-white/45">Choose voice</div>
                                <div className="mt-1 text-[13px] text-white/60">Tap play to preview, then choose “Use”.</div>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="h-10 w-10 rounded-2xl border border-white/10 bg-white/[0.06] hover:bg-white/[0.10] transition grid place-items-center"
                            aria-label="Close"
                            type="button"
                        >
                            <X className="h-5 w-5 text-white/80" />
                        </button>
                    </div>

                    {/* Grid */}
                    <div className="px-6 py-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {SPEECHIFY_CHOICES.map((v) => {
                            const isInitial = !!initialVoiceId && initialVoiceId === v.voiceId;
                            const isPlaying = playing === v.voiceId;
                            const Glyph = v.Glyph;

                            return (
                                <div
                                    key={v.voiceId}
                                    className={cn(
                                        "rounded-3xl border border-white/10 bg-white/[0.03] p-5",
                                        "hover:bg-white/[0.06] transition",
                                        isInitial ? "ring-1 ring-sky-400/40" : ""
                                    )}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]">
                        <Glyph className="h-5 w-5 text-white/80" />
                      </span>
                                            <div className="min-w-0">
                                                <div className="text-white/90 font-semibold truncate">{v.title}</div>
                                                <div className="text-[11px] text-white/45 mt-0.5">Speechify • English</div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => onPick({ voiceId: v.voiceId, title: v.title })}
                                            className={cn(
                                                "h-9 px-3 rounded-2xl text-xs font-semibold text-white",
                                                "border border-sky-400/30",
                                                "bg-gradient-to-r from-sky-500/80 via-indigo-500/70 to-fuchsia-500/70",
                                                "hover:brightness-110 transition"
                                            )}
                                            type="button"
                                        >
                                            Use
                                        </button>
                                    </div>

                                    <div className="mt-4 flex items-center justify-center">
                                        <button
                                            onClick={() => togglePlay(v.voiceId, v.preview)}
                                            className={cn(
                                                "inline-flex items-center gap-2 rounded-2xl",
                                                "border border-white/15 bg-white/[0.05] hover:bg-white/[0.10]",
                                                "px-4 py-2 text-sm font-semibold text-white/90 transition"
                                            )}
                                            type="button"
                                        >
                                            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                            {isPlaying ? "Pause" : "Play"}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <div className="px-6 pb-6">
                        <button
                            onClick={onClose}
                            className="w-full h-11 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition text-sm font-semibold text-white/85"
                            type="button"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
