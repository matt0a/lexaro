"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    ChevronDown,
    ChevronUp,
    Download,
    RefreshCcw,
    Volume2,
    VolumeX,
    Play,
    Pause,
    RotateCcw,
    RotateCw,
    Settings,
    X,
} from "lucide-react";
import {
    activeSentenceIndexByProgressWeighted,
    splitIntoSentences,
    SentenceSpan,
} from "@/lib/readalong";

function cn(...classes: Array<string | undefined | false | null>) {
    return classes.filter(Boolean).join(" ");
}

function fmtTime(seconds: number) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
}

const ALL_SPEEDS = [1, 1.25, 1.5, 2, 2.5, 3, 3.5, 5, 7.5, 10] as const;

type Props = {
    title: string;
    src: string;
    transcript: string;
    downloadHref?: string;
    onRefresh?: () => void;
    maxSpeed?: number;
};

type ViewMode = "focus" | "full";

// ✅ ONE wrapper used everywhere so page + floating player always align
const WRAP = "mx-auto max-w-5xl px-6";

function prefersReducedMotion() {
    if (typeof window === "undefined") return false;
    return !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
}

/**
 * Smooth scroll controller that EASES towards a target scrollTop.
 * Instead of snapping, it moves the whole container down smoothly.
 */
function useSmoothAutoScroll() {
    const rafRef = useRef<number | null>(null);
    const targetRef = useRef<number | null>(null);

    function cancel() {
        if (rafRef.current != null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        targetRef.current = null;
    }

    function setTarget(container: HTMLElement, target: number) {
        targetRef.current = target;

        if (rafRef.current != null) return;

        const reduce = prefersReducedMotion();
        if (reduce) {
            container.scrollTop = target;
            targetRef.current = null;
            return;
        }

        const step = () => {
            const tgt = targetRef.current;
            if (tgt == null) {
                rafRef.current = null;
                return;
            }

            const cur = container.scrollTop;
            const delta = tgt - cur;

            // close enough
            if (Math.abs(delta) < 0.75) {
                container.scrollTop = tgt;
                targetRef.current = null;
                rafRef.current = null;
                return;
            }

            // Easing: move a fraction each frame (smooth, not jumpy)
            container.scrollTop = cur + delta * 0.10;

            rafRef.current = requestAnimationFrame(step);
        };

        rafRef.current = requestAnimationFrame(step);
    }

    return { setTarget, cancel };
}

export default function ReadAlongTwoLinePlayer({
                                                   title,
                                                   src,
                                                   transcript,
                                                   downloadHref,
                                                   onRefresh,
                                                   maxSpeed = 1,
                                               }: Props) {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // speed menu refs
    const menuRef = useRef<HTMLDivElement | null>(null);
    const btnRef = useRef<HTMLButtonElement | null>(null);

    // transcript scroll container
    const transcriptScrollRef = useRef<HTMLDivElement | null>(null);

    // per-sentence refs (for smooth autoscroll target)
    const sentenceRefs = useRef<Array<HTMLDivElement | null>>([]);

    const { setTarget: setScrollTarget, cancel: cancelScroll } = useSmoothAutoScroll();

    const speeds = useMemo(() => ALL_SPEEDS.filter((s) => s <= maxSpeed), [maxSpeed]);

    const [isReady, setIsReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [current, setCurrent] = useState(0);

    const [muted, setMuted] = useState(false);
    const [rate, setRate] = useState(1);
    const [openSpeed, setOpenSpeed] = useState(false);

    // settings
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>("focus");
    const [enableHighlight, setEnableHighlight] = useState(true);
    const [enableAutoScroll, setEnableAutoScroll] = useState(true);

    const sentences = useMemo(() => splitIntoSentences(transcript || ""), [transcript]);

    const activeIdx = useMemo(() => {
        return activeSentenceIndexByProgressWeighted(sentences, current, duration);
    }, [sentences, current, duration]);

    const currentLine = activeIdx >= 0 ? sentences[activeIdx]?.text ?? "" : "";
    const nextLine = activeIdx >= 0 ? sentences[activeIdx + 1]?.text ?? "" : "";

    // keep rate valid if plan changes
    useEffect(() => {
        if (rate > maxSpeed) setRate(Math.max(1, speeds[speeds.length - 1] ?? 1));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [maxSpeed]);

    useEffect(() => {
        const a = audioRef.current;
        if (!a) return;
        a.playbackRate = rate;
    }, [rate]);

    useEffect(() => {
        const a = audioRef.current;
        if (!a) return;
        a.muted = muted;
    }, [muted]);

    // close speed menu on outside click
    useEffect(() => {
        function onDocDown(e: MouseEvent) {
            if (!openSpeed) return;
            const t = e.target as Node;
            if (menuRef.current?.contains(t)) return;
            if (btnRef.current?.contains(t)) return;
            setOpenSpeed(false);
        }
        document.addEventListener("mousedown", onDocDown);
        return () => document.removeEventListener("mousedown", onDocDown);
    }, [openSpeed]);

    // audio element events
    useEffect(() => {
        const a = audioRef.current;
        if (!a) return;

        const onLoaded = () => {
            setIsReady(true);
            setDuration(a.duration || 0);
        };
        const onTime = () => setCurrent(a.currentTime || 0);
        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onEnded = () => setIsPlaying(false);

        a.addEventListener("loadedmetadata", onLoaded);
        a.addEventListener("timeupdate", onTime);
        a.addEventListener("play", onPlay);
        a.addEventListener("pause", onPause);
        a.addEventListener("ended", onEnded);

        return () => {
            a.removeEventListener("loadedmetadata", onLoaded);
            a.removeEventListener("timeupdate", onTime);
            a.removeEventListener("play", onPlay);
            a.removeEventListener("pause", onPause);
            a.removeEventListener("ended", onEnded);
        };
    }, [src]);

    async function togglePlay() {
        const a = audioRef.current;
        if (!a) return;
        try {
            if (a.paused) await a.play();
            else a.pause();
        } catch {}
    }

    function seekTo(next: number) {
        const a = audioRef.current;
        if (!a) return;
        const clamped = Math.max(0, Math.min(next, duration || 0));
        a.currentTime = clamped;
        setCurrent(clamped);
    }

    function skip(delta: number) {
        seekTo(current + delta);
    }

    const percent = duration > 0 ? (current / duration) * 100 : 0;

    /**
     * Smooth autoscroll behavior:
     * - Only in FULL mode (since focus mode doesn't scroll content)
     * - Only if enabled
     * - Eases container scrollTop towards keeping active sentence near ~35% from top
     * - No snapping / no jump
     */
    useEffect(() => {
        if (!enableAutoScroll) {
            cancelScroll();
            return;
        }
        if (viewMode !== "full") {
            cancelScroll();
            return;
        }
        if (activeIdx < 0) return;

        const container = transcriptScrollRef.current;
        const el = sentenceRefs.current[activeIdx];
        if (!container || !el) return;

        // Keep the active sentence in a comfortable "reading band"
        const topPadding = container.clientHeight * 0.35;
        const target = el.offsetTop - topPadding;

        // clamp to container bounds
        const maxScroll = container.scrollHeight - container.clientHeight;
        const clampedTarget = Math.max(0, Math.min(target, Math.max(0, maxScroll)));

        setScrollTarget(container, clampedTarget);
    }, [activeIdx, enableAutoScroll, viewMode, setScrollTarget, cancelScroll]);

    useEffect(() => {
        return () => cancelScroll();
    }, [cancelScroll]);

    // Reset sentence refs when transcript changes
    useEffect(() => {
        sentenceRefs.current = [];
    }, [transcript]);

    return (
        <div className="relative min-h-[calc(100vh-80px)]">
            <audio ref={audioRef} src={src} preload="metadata" />

            {/* ---- Page ---- */}
            <div className={cn(WRAP, "pt-6 pb-40")}>
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md shadow-[0_26px_90px_rgba(0,0,0,.65)] overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <div className="text-[11px] tracking-[0.25em] text-white/50 uppercase">Read Along</div>
                            <div className="mt-2 text-lg font-semibold truncate text-white/90">{title}</div>
                            <div className="mt-1 text-[11px] text-white/45">
                                sentences: {sentences.length} • active: {activeIdx >= 0 ? activeIdx + 1 : "—"}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setSettingsOpen(true)}
                                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/85 hover:bg-white/10 transition"
                            >
                                <Settings className="h-4 w-4" />
                                Settings
                            </button>

                            {onRefresh ? (
                                <button
                                    onClick={onRefresh}
                                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/85 hover:bg-white/10 transition"
                                    type="button"
                                >
                                    <RefreshCcw className="h-4 w-4" />
                                    Refresh link
                                </button>
                            ) : null}

                            {downloadHref ? (
                                <a
                                    href={downloadHref}
                                    download
                                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15 transition"
                                >
                                    <Download className="h-4 w-4" />
                                    Download
                                </a>
                            ) : null}
                        </div>
                    </div>

                    {/* Body */}
                    <div className="px-7 py-6">
                        {!transcript ? (
                            <div className="text-white/60">No transcript found.</div>
                        ) : sentences.length === 0 ? (
                            <div className="text-white/60">Couldn’t split transcript into sentences.</div>
                        ) : viewMode === "focus" ? (
                            // ---------- Focus (2 lines) ----------
                            <div className="mx-auto max-w-3xl py-6">
                                <div className="text-[12px] text-white/45 mb-3">
                                    Approx highlight based on audio progress (no speech marks)
                                </div>

                                <div className="space-y-3">
                                    <div
                                        className={cn(
                                            "rounded-2xl border border-white/10 px-5 py-4",
                                            enableHighlight ? "bg-sky-400/15" : "bg-white/[0.04]",
                                            "transition-colors duration-300"
                                        )}
                                    >
                                        <div className="text-[17px] leading-8 text-white/95 whitespace-pre-wrap">
                                            {currentLine || "\u00A0"}
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 transition-colors duration-300">
                                        <div className="text-[17px] leading-8 text-white/80 whitespace-pre-wrap">
                                            {nextLine || "\u00A0"}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 text-[12px] text-white/45">
                                    Tip: punctuation/newlines help the splitter (., !, ?, newline).
                                </div>
                            </div>
                        ) : (
                            // ---------- Full transcript ----------
                            <div
                                ref={transcriptScrollRef}
                                className={cn(
                                    "relative rounded-2xl border border-white/10 bg-black/20",
                                    "px-6 py-6",
                                    "max-h-[calc(100vh-260px)] overflow-auto",
                                    "[scrollbar-width:none]",
                                    "[-ms-overflow-style:none]",
                                    "[&::-webkit-scrollbar]:hidden"
                                )}
                            >
                                <div className="text-[12px] text-white/45 mb-4">
                                    Full transcript {enableHighlight ? "(current sentence highlighted)" : "(highlighting off)"}
                                </div>

                                <div className="space-y-3">
                                    {sentences.map((s: SentenceSpan, i: number) => {
                                        const isActive = i === activeIdx;

                                        return (
                                            <div
                                                key={`${s.start}-${s.end}-${i}`}
                                                ref={(el) => {
                                                    sentenceRefs.current[i] = el;
                                                }}
                                                className={cn(
                                                    "whitespace-pre-wrap text-[15px] leading-8",
                                                    "rounded-xl px-3 py-2",
                                                    "transition-all duration-300",
                                                    enableHighlight && isActive
                                                        ? "bg-sky-400/18 text-white shadow-[0_0_0_3px_rgba(56,189,248,.10)]"
                                                        : "text-white/80 hover:bg-white/[0.03]"
                                                )}
                                                style={{
                                                    opacity: enableHighlight && isActive ? 1 : isPlaying ? 0.82 : 0.95,
                                                }}
                                                onClick={() => {
                                                    if (!duration || duration <= 0) return;
                                                    const total = sentences.reduce((a, x) => a + (x.weight || 0), 0) || 1;
                                                    const before = sentences.slice(0, i).reduce((a, x) => a + (x.weight || 0), 0);
                                                    const t = (before / total) * duration;
                                                    seekTo(t);
                                                }}
                                            >
                                                {s.text}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="mt-5 text-[12px] text-white/45">
                                    Click any sentence to jump (approx).
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ---- Floating player ---- */}
            {/* ✅ KEY LAYOUT FIX: shift the entire fixed bar to the right of the sidebar */}
            <div
                className="fixed bottom-0 z-50"
                style={{
                    left: "var(--sidebar-w, 0px)",
                    right: 0,
                }}
            >
                {/* ✅ shift gradient too (since it lives inside the shifted container now) */}
                <div className="pointer-events-none absolute inset-x-0 -top-16 h-16 bg-gradient-to-t from-black/70 to-transparent" />

                <div className={cn(WRAP, "pb-6")}>
                    <div className="rounded-3xl border border-white/10 bg-black/55 backdrop-blur-xl shadow-[0_18px_70px_rgba(0,0,0,.65)] p-5">
                        <div className="flex items-center justify-between text-xs text-white/55">
                            <div>
                                {fmtTime(current)} / {fmtTime(duration)}
                                {!isReady ? <span className="ml-2 text-white/35">Loading…</span> : null}
                            </div>
                            <div className="text-white/40">
                                {viewMode === "full" ? "Smooth autoscroll + sentence highlight" : "2-line focus mode"}
                            </div>
                        </div>

                        {/* Progress */}
                        <div className="mt-3">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 right-0 rounded-full bg-white/10" />
                                <div
                                    className="absolute inset-y-0 left-0 rounded-full"
                                    style={{
                                        width: `${percent}%`,
                                        background:
                                            "linear-gradient(90deg, rgba(56,189,248,.95), rgba(99,102,241,.95), rgba(217,70,239,.95))",
                                        boxShadow: "0 0 22px rgba(56,189,248,.25)",
                                    }}
                                />

                                <input
                                    aria-label="Seek"
                                    type="range"
                                    min={0}
                                    max={duration || 0}
                                    step={0.1}
                                    value={Math.min(current, duration || 0)}
                                    onChange={(e) => seekTo(Number(e.target.value))}
                                    className={cn(
                                        "relative w-full appearance-none bg-transparent",
                                        "[&::-webkit-slider-thumb]:appearance-none",
                                        "[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4",
                                        "[&::-webkit-slider-thumb]:rounded-full",
                                        "[&::-webkit-slider-thumb]:bg-white",
                                        "[&::-webkit-slider-thumb]:shadow-[0_0_0_4px_rgba(255,255,255,.12)]",
                                        "[&::-webkit-slider-thumb]:-translate-y-[3px]",
                                        "[&::-webkit-slider-runnable-track]:h-2",
                                        "[&::-webkit-slider-runnable-track]:rounded-full",
                                        "[&::-webkit-slider-runnable-track]:bg-transparent",
                                        "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white",
                                        "[&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-transparent"
                                    )}
                                />
                            </div>
                        </div>

                        {/* Transport */}
                        <div className="mt-4 flex items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => skip(-10)}
                                className="h-12 w-14 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition grid place-items-center"
                                aria-label="Back 10 seconds"
                            >
                                <RotateCcw className="h-5 w-5 text-white/85" />
                            </button>

                            <button
                                type="button"
                                onClick={togglePlay}
                                className="h-12 w-24 rounded-2xl border border-white/10 bg-white/10 hover:bg-white/15 transition grid place-items-center"
                                aria-label={isPlaying ? "Pause" : "Play"}
                            >
                                {isPlaying ? (
                                    <Pause className="h-6 w-6 text-white" />
                                ) : (
                                    <Play className="h-6 w-6 text-white" />
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => skip(10)}
                                className="h-12 w-14 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition grid place-items-center"
                                aria-label="Forward 10 seconds"
                            >
                                <RotateCw className="h-5 w-5 text-white/85" />
                            </button>
                        </div>

                        {/* Speed + Mute */}
                        <div className="mt-4 flex items-center justify-between gap-3">
                            <div className="relative z-[9999]">
                                <button
                                    ref={btnRef}
                                    type="button"
                                    onClick={() => setOpenSpeed((v) => !v)}
                                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/90 hover:bg-white/10 transition"
                                >
                                    Speed <span className="text-white/70">{rate}x</span>
                                    {openSpeed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </button>

                                {openSpeed ? (
                                    <div
                                        ref={menuRef}
                                        className={cn(
                                            "absolute left-0 bottom-full mb-2 w-44",
                                            "rounded-2xl border border-white/10 bg-black/95 backdrop-blur-md",
                                            "shadow-[0_24px_90px_rgba(0,0,0,.85)] overflow-hidden"
                                        )}
                                    >
                                        <div className="px-3 py-2 text-[11px] tracking-wide text-white/55 border-b border-white/10">
                                            Playback speed
                                        </div>

                                        <div
                                            className={cn(
                                                "max-h-60 overflow-auto",
                                                "[scrollbar-width:none]",
                                                "[-ms-overflow-style:none]",
                                                "[&::-webkit-scrollbar]:hidden"
                                            )}
                                        >
                                            {speeds.map((s) => {
                                                const active = s === rate;
                                                return (
                                                    <button
                                                        key={s}
                                                        type="button"
                                                        onClick={() => {
                                                            setRate(s);
                                                            setOpenSpeed(false);
                                                        }}
                                                        className={cn(
                                                            "w-full flex items-center justify-between px-3 py-2 text-sm",
                                                            active ? "bg-white/10 text-white" : "text-white/85 hover:bg-white/5"
                                                        )}
                                                    >
                                                        <span>{s}x</span>
                                                        {active ? <span className="text-emerald-300">✓</span> : <span />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : null}
                            </div>

                            <button
                                type="button"
                                onClick={() => setMuted((m) => !m)}
                                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/90 hover:bg-white/10 transition"
                            >
                                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                                {muted ? "Unmute" : "Mute"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ---- Settings drawer ---- */}
            {settingsOpen ? (
                <>
                    <div className="fixed inset-0 z-[60] bg-black/40" onClick={() => setSettingsOpen(false)} />
                    <div className="fixed right-0 top-0 bottom-0 z-[70] w-[360px] max-w-[92vw] border-l border-white/10 bg-black/70 backdrop-blur-xl shadow-[0_0_60px_rgba(0,0,0,.6)]">
                        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                            <div className="text-sm font-semibold text-white/90">Settings</div>
                            <button
                                className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 grid place-items-center transition"
                                onClick={() => setSettingsOpen(false)}
                                aria-label="Close settings"
                            >
                                <X className="h-4 w-4 text-white/85" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Mode */}
                            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                                <div className="text-xs font-semibold text-white/70 mb-3">View</div>

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setViewMode("focus")}
                                        className={cn(
                                            "flex-1 rounded-xl px-3 py-2 text-sm border border-white/10 transition",
                                            viewMode === "focus" ? "bg-white/10 text-white" : "bg-white/5 text-white/80 hover:bg-white/10"
                                        )}
                                    >
                                        Focus (2 lines)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode("full")}
                                        className={cn(
                                            "flex-1 rounded-xl px-3 py-2 text-sm border border-white/10 transition",
                                            viewMode === "full" ? "bg-white/10 text-white" : "bg-white/5 text-white/80 hover:bg-white/10"
                                        )}
                                    >
                                        Full transcript
                                    </button>
                                </div>
                            </div>

                            {/* Display */}
                            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                                <div className="text-xs font-semibold text-white/70 mb-3">Display</div>

                                <label className="flex items-center justify-between gap-3 py-2">
                                    <div className="text-sm text-white/85">Sentence Highlighting</div>
                                    <button
                                        type="button"
                                        onClick={() => setEnableHighlight((v) => !v)}
                                        className={cn(
                                            "h-7 w-12 rounded-full border border-white/10 transition relative",
                                            enableHighlight ? "bg-sky-500/60" : "bg-white/10"
                                        )}
                                    >
                    <span
                        className={cn(
                            "absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-white transition",
                            enableHighlight ? "left-6" : "left-1"
                        )}
                    />
                                    </button>
                                </label>

                                <label className="flex items-center justify-between gap-3 py-2">
                                    <div className="text-sm text-white/85">Smooth Auto Scroll</div>
                                    <button
                                        type="button"
                                        onClick={() => setEnableAutoScroll((v) => !v)}
                                        className={cn(
                                            "h-7 w-12 rounded-full border border-white/10 transition relative",
                                            enableAutoScroll ? "bg-sky-500/60" : "bg-white/10"
                                        )}
                                    >
                    <span
                        className={cn(
                            "absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-white transition",
                            enableAutoScroll ? "left-6" : "left-1"
                        )}
                    />
                                    </button>
                                </label>

                                <div className="mt-2 text-[11px] text-white/45 leading-relaxed">
                                    Auto scroll eases the page down smoothly—no snapping.
                                </div>
                            </div>

                            <div className="text-[11px] text-white/45 leading-relaxed">
                                Note: Without speech marks, timing is estimated from audio progress + sentence lengths.
                            </div>
                        </div>
                    </div>
                </>
            ) : null}
        </div>
    );
}
