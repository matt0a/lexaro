"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X, Play, Heart, Search, ChevronDown } from "lucide-react";
import Image from "next/image";
import { prettyRegion } from "../upload/prettyRegion";

/** What the picker consumes */
export type VoiceMeta = {
    id: string;
    title?: string;
    language?: string; // already human (e.g., "UK English", "Arabic")
    region?: string; // ISO (e.g., "AE", "GB")
    attitude?: string;
    gender?: "Male" | "Female" | "Other";

    // ✅ FIX: allow previews now (or omit)
    preview?: string;

    avatar?: string;
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

function normalize(v: VoiceMeta) {
    const title = (v.title && v.title.trim()) || v.id;
    // Language is already a full label from backend; fallback gracefully
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
    // map + optionally filter Polly out (defense in depth)
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

    // default language: provided initial, or first available, or 'Unknown'
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
    const [playing, setPlaying] = useState<string | null>(null);
    const audio = useRef<Record<string, HTMLAudioElement>>({}); // kept for future preview work

    useEffect(() => {
        if (!open) {
            setQuery("");
            setDropdown(false);
            Object.values(audio.current).forEach((a) => {
                try {
                    a.pause();
                } catch {}
            });
            setPlaying(null);
        }
    }, [open]);

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

    const disabledPlay = true; // previews off for now

    return (
        <div className={open ? "fixed inset-0 z-50" : "fixed inset-0 z-50 hidden"}>
            <div className="absolute inset-0 bg-black/70" onClick={onClose} />
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-black shadow-2xl">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <button
                                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm"
                                    onClick={() => setDropdown((d) => !d)}
                                    aria-haspopup="listbox"
                                    aria-expanded={dropdown}
                                >
                                    <span className="opacity-80">Language</span>
                                    <ChevronDown className="h-4 w-4 opacity-70" />
                                </button>
                                {dropdown && (
                                    <div
                                        className="absolute z-20 mt-2 w-64 rounded-xl border border-white/10 bg-black shadow-lg max-h-72 overflow-y-auto overscroll-contain pr-1"
                                        onMouseLeave={() => setDropdown(false)}
                                        role="listbox"
                                    >
                                        {allLanguages.map((l) => (
                                            <button
                                                key={l}
                                                onClick={() => {
                                                    setLanguage(l);
                                                    setDropdown(false);
                                                }}
                                                className={[
                                                    "w-full text-left px-3 py-2 text-sm hover:bg-white/5",
                                                    l === language ? "text-accent" : "text-white/80",
                                                ].join(" ")}
                                                role="option"
                                                aria-selected={l === language}
                                            >
                                                {l}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="ml-2 relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/40" />
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search voice, country, attitude…"
                                    className="pl-9 pr-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-sm outline-none focus:border-accent w-72"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {onExplore && (
                                <button
                                    onClick={onExplore}
                                    className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm hover:bg-white/10"
                                >
                                    Explore All Speechify Voices
                                </button>
                            )}
                            <button onClick={onClose} className="rounded-md p-1 hover:bg-white/5">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-[65vh] overflow-y-auto px-1 py-2">
                        {groups.length === 0 && (
                            <div className="py-16 text-center text-white/60">
                                {allowPolly ? "No matches." : "No voices available for this language yet."}
                            </div>
                        )}

                        {groups.map(([regionName, list]) => (
                            <div key={regionName} className="px-4 py-3">
                                <div className="text-sm font-medium text-white/70 mb-2">{regionName}</div>
                                <div className="rounded-xl overflow-hidden border border-white/10">
                                    {list.map((v, i) => {
                                        const isLast = i === list.length - 1;
                                        const title = v.title ?? v.id;

                                        return (
                                            <div
                                                key={v.id}
                                                className={[
                                                    "flex items-center justify-between px-4 py-3 bg-white/[0.02]",
                                                    !isLast ? "border-b border-white/10" : "",
                                                    "hover:bg-white/[0.05]",
                                                ].join(" ")}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="h-9 w-9 rounded-full bg-white/[0.05] grid place-items-center text-base">
                                                        {v.flagEmoji ?? "🏳️"}
                                                    </div>
                                                    {v.avatar ? (
                                                        <div className="relative h-9 w-9 rounded-full overflow-hidden border border-white/10">
                                                            <Image src={v.avatar} alt={title} fill className="object-cover" />
                                                        </div>
                                                    ) : null}
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

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-sm font-semibold bg-white/5 opacity-60 cursor-not-allowed"
                                                        disabled
                                                        title="Preview disabled for now"
                                                    >
                                                        <Play className="h-4 w-4" />
                                                        No preview
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            onPick({ voiceId: v.id, label: title, provider: v.provider })
                                                        }
                                                        className="rounded-md border border-accent bg-accent px-3 py-1.5 text-xs font-semibold text-white"
                                                    >
                                                        Select Voice
                                                    </button>

                                                    <button className="rounded-md p-2 hover:bg-white/5" title="Favorite">
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
                </div>
            </div>
        </div>
    );
}
