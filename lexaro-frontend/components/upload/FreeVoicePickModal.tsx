"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Lock, Crown, Sparkles, Check } from "lucide-react";

type Props = {
    open: boolean;
    initialVoiceId: string | null;
    onClose: () => void;
    onPick: (picked: { voiceId: string; title: string }) => void;

    /** optional: wire to your pricing page modal/route */
    onUpgrade?: () => void;
};

type FreeVoice = {
    voiceId: string;
    title: string;
    subtitle: string;
    note: string;
    badge?: string;
};

function cn(...classes: Array<string | undefined | null | false>) {
    return classes.filter(Boolean).join(" ");
}

export default function FreeVoicePickModal({
                                               open,
                                               initialVoiceId,
                                               onClose,
                                               onPick,
                                               onUpgrade,
                                           }: Props) {
    const voices: FreeVoice[] = useMemo(
        () => [
            {
                voiceId: "Joanna",
                title: "Joanna",
                subtitle: "Female · Polly Standard · English",
                note: "Clear and friendly. Great for everyday reading.",
                badge: "Recommended",
            },
            {
                voiceId: "Matthew",
                title: "Matthew",
                subtitle: "Male · Polly Standard · English",
                note: "Warm and steady. Great for long sessions.",
            },
        ],
        []
    );

    const [selected, setSelected] = useState<string>(() => initialVoiceId ?? "Joanna");

    useEffect(() => {
        if (!open) return;
        setSelected(initialVoiceId ?? "Joanna");
    }, [open, initialVoiceId]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "Enter") {
                const v = voices.find((x) => x.voiceId === selected);
                if (v) onPick({ voiceId: v.voiceId, title: v.title });
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose, onPick, selected, voices]);

    if (!open) return null;

    const chosen = voices.find((v) => v.voiceId === selected) ?? voices[0];

    return (
        <div className="fixed inset-0 z-[9999]">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-[6px]"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div
                    role="dialog"
                    aria-modal="true"
                    className={cn(
                        "w-full max-w-2xl overflow-hidden",
                        "rounded-3xl border border-white/10",
                        "bg-black/70 backdrop-blur-xl",
                        "shadow-[0_30px_120px_rgba(0,0,0,.75)]"
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-white/10">
                        <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-2xl border border-white/10 bg-white/[0.06] grid place-items-center">
                                <Lock className="h-5 w-5 text-white/80" />
                            </div>
                            <div>
                                <div className="text-sm tracking-[0.22em] uppercase text-white/45">
                                    Free voices
                                </div>
                                <div className="mt-1 text-[13px] text-white/60">
                                    Pick a free voice. Upgrade to unlock premium voices, previews, and more languages.
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

                    {/* Body */}
                    <div className="px-6 py-6 space-y-4">
                        {/* Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {voices.map((v) => {
                                const active = v.voiceId === selected;

                                return (
                                    <button
                                        key={v.voiceId}
                                        type="button"
                                        onClick={() => setSelected(v.voiceId)}
                                        className={cn(
                                            "text-left rounded-3xl border p-4 transition relative overflow-hidden",
                                            active
                                                ? "border-sky-400/35 bg-white/[0.06]"
                                                : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
                                        )}
                                    >
                                        {/* glow */}
                                        {active ? (
                                            <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-sky-500/10 via-indigo-500/5 to-fuchsia-500/10" />
                                        ) : null}

                                        <div className="relative flex items-start justify-between gap-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <div className="text-base font-semibold text-white/90">
                                                        {v.title}
                                                    </div>
                                                    {v.badge ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[11px] text-white/70">
                              <Sparkles className="h-3 w-3" />
                                                            {v.badge}
                            </span>
                                                    ) : null}
                                                </div>

                                                <div className="mt-1 text-xs text-white/55">{v.subtitle}</div>
                                                <div className="mt-2 text-[12px] text-white/60">{v.note}</div>

                                                <div className="mt-3 text-[11px] text-white/40">
                                                    No preview on Free plan.
                                                </div>
                                            </div>

                                            <div
                                                className={cn(
                                                    "h-9 w-9 rounded-2xl grid place-items-center border transition shrink-0",
                                                    active
                                                        ? "border-sky-400/40 bg-sky-400/10"
                                                        : "border-white/10 bg-white/[0.04]"
                                                )}
                                                aria-hidden="true"
                                            >
                                                {active ? <Check className="h-5 w-5 text-sky-200" /> : null}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Upgrade strip */}
                        <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 px-4 py-3">
                            <div className="flex items-start gap-3">
                                <div className="h-9 w-9 rounded-2xl border border-amber-400/20 bg-amber-400/10 grid place-items-center shrink-0">
                                    <Crown className="h-5 w-5 text-amber-200" />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-sm font-semibold text-amber-100">
                                        Upgrade to unlock premium voices & instant previews
                                    </div>
                                    <div className="mt-1 text-[12px] text-amber-100/70">
                                        More natural voices, more languages, faster generation, and preview playback.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-11 px-4 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition text-sm font-semibold text-white/80"
                        >
                            Cancel
                        </button>

                        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                            <button
                                type="button"
                                onClick={() => onUpgrade?.()}
                                className={cn(
                                    "h-11 px-4 rounded-2xl text-sm font-semibold",
                                    "border border-amber-400/25 bg-amber-400/10 text-amber-100",
                                    "hover:bg-amber-400/15 transition"
                                )}
                            >
                                Upgrade
                            </button>

                            <button
                                type="button"
                                onClick={() => onPick({ voiceId: chosen.voiceId, title: chosen.title })}
                                className={cn(
                                    "h-11 px-5 rounded-2xl text-sm font-semibold text-white",
                                    "border border-sky-400/30",
                                    "bg-gradient-to-r from-sky-500/80 via-indigo-500/70 to-fuchsia-500/70",
                                    "shadow-[0_14px_40px_rgba(56,189,248,.18)]",
                                    "hover:brightness-110 transition"
                                )}
                            >
                                Select {chosen.title}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
