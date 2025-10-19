'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Play, Pause, Heart, Search, ChevronDown } from 'lucide-react';
import Image from 'next/image';

/** A single voice in your catalog (Speechify/Polly/etc). */
export type VoiceMeta = {
    id: string;                 // provider voice id (Speechify voice_id)
    title: string;              // display name (Kristy, Mason…)
    language: string;           // e.g., "English"
    region: string;             // e.g., "United States", "United Kingdom", "India"
    attitude?: string;          // Warm, Professional, Gentle…
    gender?: 'Male' | 'Female' | 'Other';
    preview?: string;           // mp3 URL
    avatar?: string;            // optional headshot
    flagEmoji?: string;         // 🇺🇸 🇬🇧 etc
    favorite?: boolean;
};

/** What the caller needs to start TTS. */
export type PickedVoice = {
    voiceId: string;            // same as VoiceMeta.id
    label: string;              // friendly label for UI (title)
};

type Props = {
    open: boolean;
    onClose: () => void;
    /** Called when a voice is chosen. */
    onPick: (v: PickedVoice) => void;
    /** Optional: full catalog; if not provided we render a small sample so UI works. */
    voices?: VoiceMeta[];
    /** Optional: open the full-page/advanced explorer. */
    onExplore?: () => void;
    /** Default language tab. */
    initialLang?: string;
};

/* --- Temporary sample so the UI renders even before catalog is wired --- */
const SAMPLE: VoiceMeta[] = [
    { id: 'kristy', title: 'Kristy', language: 'English', region: 'United States', attitude: 'Dynamic', gender: 'Female', preview: '/audio/onboarding/onboarding_kristy.mp3', flagEmoji: '🇺🇸' },
    { id: 'mason',  title: 'Mason',  language: 'English', region: 'United States', attitude: 'Bright',  gender: 'Male',   preview: '/audio/onboarding/onboarding_mason.mp3',  flagEmoji: '🇺🇸' },
    { id: 'harper', title: 'Harper', language: 'English', region: 'United Kingdom', attitude: 'Warm',   gender: 'Female', preview: '/audio/onboarding/onboarding_harper.mp3', flagEmoji: '🇬🇧' },
    { id: 'alloy',  title: 'Alloy',  language: 'English', region: 'India',          attitude: 'Deep',   gender: 'Male',   preview: '/audio/onboarding/onboarding_alloy.mp3',  flagEmoji: '🇮🇳' },
];

export default function VoicePickerModal({
                                             open,
                                             onClose,
                                             onPick,
                                             onExplore,
                                             voices = SAMPLE,
                                             initialLang = 'English',
                                         }: Props) {
    // All hooks live at the top — never after a conditional return
    const [query, setQuery] = useState('');
    const [language, setLanguage] = useState(initialLang);
    const [dropdown, setDropdown] = useState(false);
    const [playing, setPlaying] = useState<string | null>(null);
    const audio = useRef<Record<string, HTMLAudioElement>>({});

    // Reset transient UI when `open` toggles; also stop audio when closing
    useEffect(() => {
        if (!open) {
            setQuery('');
            setDropdown(false);
            setPlaying(null);
            Object.values(audio.current).forEach(a => {
                try { a.pause(); a.currentTime = 0; } catch {}
            });
        }
    }, [open]);

    // Derived lists (still hooks, so must be above any early return)
    const languages = useMemo(
        () => Array.from(new Set((voices ?? []).map(v => v.language))).sort(),
        [voices]
    );

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return (voices ?? []).filter(v =>
            v.language === language &&
            (!q || [v.title, v.region, v.attitude ?? ''].some(s => s.toLowerCase().includes(q)))
        );
    }, [voices, language, query]);

    // group by region (dialect)
    const groups = useMemo(() => {
        const by: Record<string, VoiceMeta[]> = {};
        filtered.forEach(v => {
            const key = v.region || 'Other';
            (by[key] ||= []).push(v);
        });
        Object.values(by).forEach(arr => arr.sort((a, b) => a.title.localeCompare(b.title)));
        return Object.entries(by).sort(([a], [b]) => a.localeCompare(b));
    }, [filtered]);

    const togglePlay = (id: string, src?: string) => {
        if (!src) return;

        if (!audio.current[id]) {
            const a = new Audio(src);
            a.preload = 'auto';
            a.addEventListener('ended', () => setPlaying(p => (p === id ? null : p)));
            audio.current[id] = a;
        }

        // stop other previews
        Object.entries(audio.current).forEach(([k, a]) => {
            if (k !== id) {
                try { a.pause(); a.currentTime = 0; } catch {}
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

    // Only now is it safe to conditionally not render
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/70" onClick={onClose} />
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-black shadow-2xl">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <button
                                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm"
                                    onClick={() => setDropdown(d => !d)}
                                >
                                    <span className="opacity-80">Language</span>
                                    <ChevronDown className="h-4 w-4 opacity-70" />
                                </button>
                                {dropdown && (
                                    <div
                                        className="absolute z-10 mt-2 w-52 rounded-xl border border-white/10 bg-black shadow-lg"
                                        onMouseLeave={() => setDropdown(false)}
                                    >
                                        {languages.map(l => (
                                            <button
                                                key={l}
                                                onClick={() => { setLanguage(l); setDropdown(false); }}
                                                className={[
                                                    'w-full text-left px-3 py-2 text-sm hover:bg-white/5',
                                                    l === language ? 'text-accent' : 'text-white/80',
                                                ].join(' ')}
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
                                    onChange={e => setQuery(e.target.value)}
                                    placeholder="Search voice, region, attitude…"
                                    className="pl-9 pr-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-sm outline-none focus:border-accent"
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
                            <div className="py-16 text-center text-white/60">No matches.</div>
                        )}

                        {groups.map(([region, list]) => (
                            <div key={region} className="px-4 py-3">
                                <div className="text-sm font-medium text-white/70 mb-2">{region}</div>
                                <div className="rounded-xl overflow-hidden border border-white/10">
                                    {list.map((v, i) => {
                                        const isLast = i === list.length - 1;
                                        const active = playing === v.id;
                                        return (
                                            <div
                                                key={v.id}
                                                className={[
                                                    'flex items-center justify-between px-4 py-3 bg-white/[0.02]',
                                                    !isLast ? 'border-b border-white/10' : '',
                                                    'hover:bg-white/[0.05]',
                                                ].join(' ')}
                                            >
                                                {/* left identity */}
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="h-9 w-9 rounded-full bg-white/[0.05] grid place-items-center text-base">
                                                        {v.flagEmoji ?? '🏳️'}
                                                    </div>
                                                    {v.avatar ? (
                                                        <div className="relative h-9 w-9 rounded-full overflow-hidden border border-white/10">
                                                            <Image src={v.avatar} alt={v.title} fill className="object-cover" />
                                                        </div>
                                                    ) : null}
                                                    <div className="min-w-0">
                                                        <div className="text-white/90 font-medium truncate">{v.title}</div>
                                                        <div className="text-xs text-white/60 truncate">
                                                            {v.language}{v.region ? ` · ${v.region}` : ''}{v.attitude ? ` · ${v.attitude}` : ''}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* right actions */}
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => togglePlay(v.id, v.preview)}
                                                        className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-sm font-semibold bg-white/5 hover:bg-white/10"
                                                    >
                                                        {active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                                        {active ? 'Pause' : 'Play'}
                                                    </button>
                                                    <button
                                                        onClick={() => onPick({ voiceId: v.id, label: v.title })}
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
