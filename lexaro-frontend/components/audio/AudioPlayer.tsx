"use client";

import React from "react";
import {
    Download,
    RefreshCcw,
    Volume2,
    VolumeX,
    Pause,
    Play,
    RotateCcw,
    RotateCw,
} from "lucide-react";

function cn(...classes: Array<string | undefined | false | null>) {
    return classes.filter(Boolean).join(" ");
}

type Props = {
    src: string;
    filename?: string;
    downloadHref?: string;
    onRefresh?: () => void;
    maxSpeed?: 1 | 3.5 | 10;
    className?: string;
};

const SPEED_PRESETS: number[] = [1, 1.25, 1.5, 1.75, 2, 2.5, 3, 3.5, 5, 7.5, 10];

function formatTime(sec: number) {
    if (!Number.isFinite(sec) || sec < 0) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
}

export default function AudioPlayer({
                                        src,
                                        filename,
                                        downloadHref,
                                        onRefresh,
                                        maxSpeed = 1,
                                        className,
                                    }: Props) {
    const audioRef = React.useRef<HTMLAudioElement | null>(null);

    const [ready, setReady] = React.useState(false);
    const [playing, setPlaying] = React.useState(false);
    const [muted, setMuted] = React.useState(false);
    const [rate, setRate] = React.useState<number>(1);

    const [duration, setDuration] = React.useState(0);
    const [current, setCurrent] = React.useState(0);

    const allowedSpeeds = React.useMemo(
        () => SPEED_PRESETS.filter((x) => x <= maxSpeed),
        [maxSpeed]
    );

    // keep rate inside cap
    React.useEffect(() => {
        if (rate > maxSpeed) setRate(maxSpeed);
    }, [maxSpeed, rate]);

    // apply settings
    React.useEffect(() => {
        const el = audioRef.current;
        if (!el) return;
        el.playbackRate = rate;
        el.muted = muted;
    }, [rate, muted]);

    // reset on src change
    React.useEffect(() => {
        setReady(false);
        setPlaying(false);
        setCurrent(0);
        setDuration(0);
    }, [src]);

    const togglePlay = async () => {
        const el = audioRef.current;
        if (!el) return;
        try {
            if (el.paused) await el.play();
            else el.pause();
        } catch {
            // ignore
        }
    };

    const seekBy = (delta: number) => {
        const el = audioRef.current;
        if (!el) return;
        const d = Number.isFinite(el.duration) ? el.duration : duration;
        const next = Math.max(0, Math.min((el.currentTime || 0) + delta, d || 0));
        el.currentTime = next;
        setCurrent(next);
    };

    const onScrub = (v: number) => {
        const el = audioRef.current;
        if (!el) return;
        el.currentTime = v;
        setCurrent(v);
    };

    const cycleSpeed = () => {
        const idx = allowedSpeeds.findIndex((s) => s === rate);
        const next = idx === -1 ? allowedSpeeds[0] : allowedSpeeds[(idx + 1) % allowedSpeeds.length];
        setRate(next);
    };

    const progressPct =
        duration > 0 ? Math.max(0, Math.min(100, (current / duration) * 100)) : 0;

    return (
        <div
            className={cn(
                "rounded-2xl border border-white/10 bg-black/45 backdrop-blur-md",
                "shadow-[0_20px_60px_rgba(0,0,0,.45)]",
                className
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-4 pt-4">
                <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white/90">
                        {filename ?? "Audio"}
                    </div>
                    <div className="mt-0.5 text-xs text-white/55">
                        {ready ? `${formatTime(current)} / ${formatTime(duration)}` : "Loading…"}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {onRefresh ? (
                        <button
                            onClick={onRefresh}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10 transition"
                            title="Refresh link"
                        >
                            <RefreshCcw className="h-4 w-4" />
                            Refresh link
                        </button>
                    ) : null}

                    {downloadHref ? (
                        <a
                            href={downloadHref}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs hover:bg-white/15 transition"
                            title="Download"
                        >
                            <Download className="h-4 w-4" />
                            Download
                        </a>
                    ) : null}
                </div>
            </div>

            {/* Timeline (colorful) */}
            <div className="px-4 pt-3">
                <div className="relative">
                    {/* track */}
                    <div className="h-2 w-full rounded-full bg-white/10" />
                    {/* fill */}
                    <div
                        className="absolute left-0 top-0 h-2 rounded-full bg-gradient-to-r from-sky-500 via-violet-500 to-fuchsia-500"
                        style={{ width: `${progressPct}%` }}
                    />
                    {/* input sits on top */}
                    <input
                        aria-label="Seek"
                        type="range"
                        min={0}
                        max={Math.max(0, duration)}
                        step={0.1}
                        value={Math.min(current, duration)}
                        onChange={(e) => onScrub(Number(e.target.value))}
                        className={cn(
                            "absolute inset-0 w-full cursor-pointer bg-transparent",
                            // normalize vertical alignment (fix thumb sitting too low)
                            "appearance-none",
                            "[&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-transparent",
                            "[&::-webkit-slider-thumb]:appearance-none",
                            "[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4",
                            "[&::-webkit-slider-thumb]:rounded-full",
                            "[&::-webkit-slider-thumb]:bg-white",
                            "[&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-white/30",
                            "[&::-webkit-slider-thumb]:shadow-[0_10px_30px_rgba(0,0,0,.6)]",
                            // center thumb on the track
                            "[&::-webkit-slider-thumb]:mt-[-4px]",
                            // firefox
                            "[&::-moz-range-track]:h-2 [&::-moz-range-track]:bg-transparent",
                            "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white"
                        )}
                    />
                </div>
            </div>

            {/* Main controls */}
            <div className="px-4 pt-4">
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={() => seekBy(-10)}
                        className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 h-11 w-11 hover:bg-white/10 transition"
                        title="Back 10 seconds"
                    >
                        <RotateCcw className="h-5 w-5 text-white/85" />
                    </button>

                    <button
                        onClick={togglePlay}
                        className={cn(
                            "inline-flex items-center justify-center rounded-2xl h-11 w-20",
                            "border border-white/10 bg-white/10 hover:bg-white/15 transition"
                        )}
                        title={playing ? "Pause" : "Play"}
                    >
                        {playing ? (
                            <Pause className="h-5 w-5 text-white" />
                        ) : (
                            <Play className="h-5 w-5 text-white" />
                        )}
                    </button>

                    <button
                        onClick={() => seekBy(10)}
                        className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 h-11 w-11 hover:bg-white/10 transition"
                        title="Forward 10 seconds"
                    >
                        <RotateCw className="h-5 w-5 text-white/85" />
                    </button>
                </div>
            </div>

            {/* Secondary row */}
            <div className="px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={cycleSpeed}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10 transition"
                            title="Playback speed"
                        >
                            <span className="font-semibold text-white/90">{rate}×</span>
                            <span className="text-white/55">Speed</span>
                        </button>
                        <div className="hidden sm:block text-[11px] text-white/50">Max: {maxSpeed}×</div>
                    </div>

                    <button
                        onClick={() => setMuted((m) => !m)}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10 transition"
                        title={muted ? "Unmute" : "Mute"}
                    >
                        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        {muted ? "Unmute" : "Mute"}
                    </button>
                </div>
            </div>

            {/* Hidden audio element */}
            <audio
                ref={audioRef}
                src={src}
                preload="metadata"
                onLoadedMetadata={(e) => {
                    const el = e.currentTarget;
                    const d = Number.isFinite(el.duration) ? el.duration : 0;
                    setDuration(d);
                    setReady(true);
                }}
                onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime || 0)}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => setPlaying(false)}
            />
        </div>
    );
}
