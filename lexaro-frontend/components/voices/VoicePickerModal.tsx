"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X, Play, Pause, Heart, Search, ChevronDown } from "lucide-react";
import Image from "next/image";
import { prettyRegion } from "../upload/prettyRegion";

/** What the picker consumes */
export type VoiceMeta = {
    id: string;
    title?: string;
    language?: string; // already human: "US English", "Canadian French", etc.
    region?: string;   // "US", "GB", ...
    attitude?: string;
    gender?: "Male" | "Female" | "Other";
    preview?: string;  // ✅ preview audio url
    avatar?: string;   // ✅ avatar image url
    flagEmoji?: string;
    favorite?: boolean;
    provider: "speechify" | "polly";
};

export type PickedVoice = {
    voiceId: string;
    label: string;
    provider: "speechify" | "polly";
};

type Props = {
    open: boolean;
    onClose: () => void;
    onPick: (v: PickedVoice) => void;
    voices?: VoiceMeta[];
    onExplore?: () => void;
    initialLang?: string;
    allowPolly?: boolean;
};

function cn(...classes: Array<string | undefined | false | null>) {
    return classes.filter(Boolean).join(" ");
}

function normalize(v: VoiceMeta) {
    const title = (v.title && v.title.trim()) || v.id;
    const language = (v.language && v.language.trim()) || "Unknown";
    const region = v.region?.trim().toUpperCase() || "";
    return { ...v, title, language, region };
}

export default function VoicePickerModal({
                                             open,
                                             onClose,
                                             onPick,
                                             onExplore,
                                             voices: voicesProp,
                                             initialLang,
                                             allowPolly = true,
                                         }: Props) {
    const normalized = useMemo(() => {
        const src = Array.isArray(voicesProp) ? voicesProp : [];
        const filtered = allowPolly ? src : src.filter((v) => v.provider !== "polly");
        return filtered.map(normalize);
    }, [voicesProp, allowPolly]);

    const [query, setQuery] = useState("");
    const allLanguages = useMemo(() => {
        const set = new Set<string>();
        normalized.forEach((v) => {
            if (v.language) set.add(v.language);
        });
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [normalized]);

    const [language, setLanguage] = useState<string>(
        initialLang || allLanguages[0] || "Unknown"
    );

    useEffect(() => {
        if (!allLanguages.includes(language)) {
            setLanguage(allLanguages[0] || "Unknown");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allLanguages.join("|")]);

    const [dropdown, setDropdown] = useState(false);

    // ✅ Single audio player for the whole modal
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [busyPreview, setBusyPreview] = useState(false);

    const stopPreview = () => {
        try {
            const a = audioRef.current;
            if (a) {
                a.pause();
                a.currentTime = 0;
                a.src = ""; // release
            }
        } catch {}
        setPlayingId(null);
        setBusyPreview(false);
    };

    useEffect(() => {
        if (!open) {
            setQuery("");
            setDropdown(false);
            stopPreview();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const togglePreview = async (v: VoiceMeta) => {
        if (!v.preview) return;

        // stop if same voice already playing
        if (playingId === v.id) {
            stopPreview();
            return;
        }

        setBusyPreview(true);

        try {
            if (!audioRef.current) audioRef.current = new Audio();
            const a = audioRef.current;

            // stop whatever was playing
            try {
                a.pause();
            } catch {}

            a.src = v.preview;
            a.currentTime = 0;

            a.onended = () => {
                setPlayingId(null);
                setBusyPreview(false);
            };

            a.onerror = () => {
                setPlayingId(null);
                setBusyPreview(false);
            };

            await a.play();
            setPlayingId(v.id);
        } catch {
            setPlayingId(null);
        } finally {
            setBusyPreview(false);
        }
    };

    // ESC closes + stops audio
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                stopPreview();
                onClose();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return normalized.filter(
            (v) =>
                v.language === language &&
                (!q ||
                    [v.title, v.region, v.attitude ?? ""].some((s) =>
                        (s ?? "").toLowerCase().includes(q)
                    ))
        );
    }, [normalized, language, query]);

    const groups = useMemo(() => {
        const by: Record<string, VoiceMeta[]> = {};
        for (const v of filtered) {
            const key = prettyRegion(v.region) || "Other";
            (by[key] ||= []).push(v);
        }
        Object.values(by).forEach((arr) =>
            arr.sort((a, b) => (a.title ?? a.id).localeCompare(b.title ?? b.id))
        );
        return Object.entries(by).sort(([a], [b]) => a.localeCompare(b));
    }, [filtered]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-[6px]"
                onClick={() => {
                    stopPreview();
                    onClose();
                }}
            />

            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-black/70 backdrop-blur-xl shadow-[0_30px_120px_rgba(0,0,0,.75)] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <button
                                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm hover:bg-white/[0.08] transition"
                                    onClick={() => setDropdown((d) => !d)}
                                    aria-haspopup="listbox"
                                    aria-expanded={dropdown}
                                    type="button"
                                >
                                    <span className="opacity-80">Language</span>
                                    <ChevronDown className="h-4 w-4 opacity-70" />
                                </button>

                                {dropdown && (
                                    <div
                                        className="absolute z-20 mt-2 w-64 rounded-2xl border border-white/10 bg-black/90 backdrop-blur-xl shadow-lg max-h-72 overflow-y-auto overscroll-contain pr-1"
                                        role="listbox"
                                    >
                                        {allLanguages.map((l) => (
                                            <button
                                                key={l}
                                                onClick={() => {
                                                    setLanguage(l);
                                                    setDropdown(false);
                                                }}
                                                className={cn(
                                                    "w-full text-left px-4 py-2 text-sm hover:bg-white/5 transition",
                                                    l === language ? "text-sky-300" : "text-white/80"
                                                )}
                                                role="option"
                                                aria-selected={l === language}
                                                type="button"
                                            >
                                                {l}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/40" />
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search voice, region, style…"
                                    className="pl-9 pr-3 py-2 rounded-2xl bg-white/[0.04] border border-white/10 text-sm outline-none focus:border-sky-400/40 focus:ring-4 focus:ring-sky-400/10 w-72"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {onExplore && (
                                <button
                                    onClick={onExplore}
                                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm hover:bg-white/[0.08] transition"
                                    type="button"
                                >
                                    Explore All Speechify Voices
                                </button>
                            )}

                            <button
                                onClick={() => {
                                    stopPreview();
                                    onClose();
                                }}
                                className="h-10 w-10 rounded-2xl border border-white/10 bg-white/[0.06] hover:bg-white/[0.10] transition grid place-items-center"
                                aria-label="Close"
                                type="button"
                            >
                                <X className="h-5 w-5 text-white/80" />
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-[65vh] overflow-y-auto px-2 py-3">
                        {groups.length === 0 && (
                            <div className="py-16 text-center text-white/60">
                                {allowPolly ? "No matches." : "No voices available for this language yet."}
                            </div>
                        )}

                        {groups.map(([regionName, list]) => (
                            <div key={regionName} className="px-4 py-3">
                                <div className="text-sm font-medium text-white/70 mb-2">{regionName}</div>

                                <div className="rounded-2xl overflow-hidden border border-white/10">
                                    {list.map((v, i) => {
                                        const isLast = i === list.length - 1;
                                        const title = v.title ?? v.id;
                                        const canPreview = !!v.preview;

                                        return (
                                            <div
                                                key={v.id}
                                                className={cn(
                                                    "flex items-center justify-between gap-4 px-4 py-3 bg-white/[0.02] hover:bg-white/[0.05] transition",
                                                    !isLast ? "border-b border-white/10" : ""
                                                )}
                                            >
                                                {/* Left */}
                                                <div className="flex items-center gap-3 min-w-0">
                                                    {/* Avatar (preferred) or flag */}
                                                    {v.avatar ? (
                                                        <div className="relative h-10 w-10 rounded-full overflow-hidden border border-white/10 bg-white/[0.04] shrink-0">
                                                            <Image src={v.avatar} alt={title} fill className="object-cover" />
                                                        </div>
                                                    ) : (
                                                        <div className="h-10 w-10 rounded-full bg-white/[0.05] grid place-items-center text-base border border-white/10 shrink-0">
                                                            {v.flagEmoji ?? "🏳️"}
                                                        </div>
                                                    )}

                                                    <div className="min-w-0">
                                                        <div className="text-white/90 font-medium truncate">{title}</div>
                                                        <div className="text-xs text-white/60 truncate">
                                                            {v.language ?? "Unknown"}
                                                            {v.region ? ` · ${prettyRegion(v.region)}` : ""}
                                                            {v.gender && v.gender !== "Other" ? ` · ${v.gender}` : ""}
                                                            {v.attitude ? ` · ${v.attitude}` : ""}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right */}
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button
                                                        onClick={() => togglePreview(v)}
                                                        disabled={!canPreview || busyPreview}
                                                        className={cn(
                                                            "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
                                                            canPreview
                                                                ? "border-white/15 bg-white/5 hover:bg-white/10"
                                                                : "border-white/10 bg-white/[0.03] opacity-60 cursor-not-allowed"
                                                        )}
                                                        type="button"
                                                        title={canPreview ? "Play preview" : "No preview available"}
                                                    >
                                                        {playingId === v.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                                        {canPreview ? (playingId === v.id ? "Pause" : "Play") : "No preview"}
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            stopPreview();
                                                            onPick({ voiceId: v.id, label: title, provider: v.provider });
                                                        }}
                                                        className="rounded-2xl border border-sky-400/30 bg-gradient-to-r from-sky-500/80 via-indigo-500/70 to-fuchsia-500/70 px-4 py-2 text-xs font-semibold text-white hover:brightness-110 transition"
                                                        type="button"
                                                    >
                                                        Select
                                                    </button>

                                                    <button
                                                        className="h-10 w-10 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition grid place-items-center"
                                                        title="Favorite"
                                                        type="button"
                                                    >
                                                        <Heart className="h-4 w-4 opacity-70" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-white/10 text-xs text-white/50">
                        Tip: click Play to hear a preview before selecting.
                    </div>
                </div>
            </div>
        </div>
    );
}
