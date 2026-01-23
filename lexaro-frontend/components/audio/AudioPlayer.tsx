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
} from "lucide-react";

function cn(...classes: Array<string | undefined | false | null>) {
    return classes.filter(Boolean).join(" ");
}

function fmtTime(seconds: number) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
}

type Props = {
    className?: string;
    src: string;
    downloadHref?: string;
    onRefresh?: () => void;

    /** 1 for Free, 3.5 for Premium, 10 for Premium+ */
    maxSpeed?: number;

    /** Optional: stop card clicks from triggering when interacting with the player */
    stopClickPropagation?: boolean;
};

const ALL_SPEEDS = [1, 1.25, 1.5, 2, 2.5, 3, 3.5, 5, 7.5, 10] as const;

export default function AudioPlayer({
                                        className,
                                        src,
                                        downloadHref,
                                        onRefresh,
                                        maxSpeed = 1,
                                        stopClickPropagation = true,
                                    }: Props) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const btnRef = useRef<HTMLButtonElement | null>(null);

    const speeds = useMemo(() => ALL_SPEEDS.filter((s) => s <= maxSpeed), [maxSpeed]);

    const [isReady, setIsReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    const [duration, setDuration] = useState(0);
    const [current, setCurrent] = useState(0);

    const [muted, setMuted] = useState(false);
    const [rate, setRate] = useState<number>(1);
    const [openSpeed, setOpenSpeed] = useState(false);

    // Keep rate valid if plan changes
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

    // Close speed menu on outside click
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

    // Audio events
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
        } catch {
            // ignore autoplay restrictions
        }
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

    return (
        <div
            onClick={stopClickPropagation ? (e) => e.stopPropagation() : undefined}
            className={cn(
                "relative z-0 isolate overflow-visible",
                "rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md",
                "shadow-[0_18px_70px_rgba(0,0,0,.55)]",
                "p-4",
                className
            )}
        >
            <audio ref={audioRef} src={src} preload="metadata" />

            {/* Actions row */}
            <div className="flex items-center justify-between gap-2">
                <div className="text-xs text-white/55">
                    {fmtTime(current)} / {fmtTime(duration)}
                    {!isReady ? <span className="ml-2 text-white/35">Loading…</span> : null}
                </div>

                <div className="flex items-center gap-2">
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

            {/* Progress */}
            <div className="mt-4">
                <div className="relative h-6">
                    {/* base track (centered) */}
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-white/10" />

                    {/* fill (centered) */}
                    <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-2 rounded-full"
                        style={{
                            width: `${percent}%`,
                            background:
                                "linear-gradient(90deg, rgba(56,189,248,.95), rgba(99,102,241,.95), rgba(217,70,239,.95))",
                            boxShadow: "0 0 22px rgba(56,189,248,.25)",
                        }}
                    />

                    {/* IMPORTANT: use a real CSS class for the slider */}
                    <input
                        aria-label="Seek"
                        type="range"
                        min={0}
                        max={duration || 0}
                        step={0.1}
                        value={Math.min(current, duration || 0)}
                        onChange={(e) => seekTo(Number(e.target.value))}
                        className="audio-seek absolute inset-0 w-full h-6 bg-transparent cursor-pointer"
                    />
                </div>
            </div>

            {/* Transport */}
            <div className="mt-4 flex items-center justify-center gap-3">
                <button
                    type="button"
                    onClick={() => skip(-10)}
                    className="h-11 w-12 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition grid place-items-center"
                    aria-label="Back 10 seconds"
                >
                    <RotateCcw className="h-5 w-5 text-white/85" />
                </button>

                <button
                    type="button"
                    onClick={togglePlay}
                    className="h-11 w-20 rounded-2xl border border-white/10 bg-white/10 hover:bg-white/15 transition grid place-items-center"
                    aria-label={isPlaying ? "Pause" : "Play"}
                >
                    {isPlaying ? (
                        <Pause className="h-5 w-5 text-white" />
                    ) : (
                        <Play className="h-5 w-5 text-white" />
                    )}
                </button>

                <button
                    type="button"
                    onClick={() => skip(10)}
                    className="h-11 w-12 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition grid place-items-center"
                    aria-label="Forward 10 seconds"
                >
                    <RotateCw className="h-5 w-5 text-white/85" />
                </button>
            </div>

            {/* Controls */}
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
    );
}
