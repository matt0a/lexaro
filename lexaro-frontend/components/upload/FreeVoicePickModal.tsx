"use client";

import { useEffect, useMemo, useState } from "react";
import { X, User, UserRound, Lock } from "lucide-react";

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

const FREE_CHOICES = [
    { voiceId: "Joanna", title: "Female (Joanna)", Glyph: User },
    { voiceId: "Matthew", title: "Male (Matthew)", Glyph: UserRound },
] as const;

export default function FreeVoicePickModal({ open, onClose, onPick, initialVoiceId }: Props) {
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

    if (!open) return null;

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
                        "w-full max-w-2xl overflow-hidden",
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
                                <Lock className="h-5 w-5 text-white/80" />
                            </div>
                            <div>
                                <div className="text-sm tracking-[0.22em] uppercase text-white/45">Free voices</div>
                                <div className="mt-1 text-[13px] text-white/60">
                                    Pick one of the free voices. Upgrade to unlock premium voices and previews.
                                </div>
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

                    {/* Choices */}
                    <div className="px-6 py-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {FREE_CHOICES.map((v) => {
                            const Glyph = v.Glyph;
                            const isInitial = !!initialVoiceId && initialVoiceId === v.voiceId;

                            return (
                                <button
                                    key={v.voiceId}
                                    onClick={() => onPick({ voiceId: v.voiceId, title: v.title })}
                                    className={cn(
                                        "rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-left",
                                        "hover:bg-white/[0.06] transition",
                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40",
                                        isInitial ? "ring-1 ring-sky-400/35" : ""
                                    )}
                                    type="button"
                                >
                                    <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]">
                      <Glyph className="h-5 w-5 text-white/80" />
                    </span>
                                        <div>
                                            <div className="text-white/90 font-semibold">{v.title}</div>
                                            <div className="mt-0.5 text-[11px] text-white/45">Polly • Standard • English</div>
                                        </div>
                                    </div>

                                    <div className="mt-3 text-[11px] text-white/45">
                                        No preview on free plan.
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <div className="px-6 pb-6 space-y-3">
                        <div className="rounded-2xl border border-yellow-500/25 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
                            Upgrade to unlock premium voices and voice previews.
                        </div>

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
