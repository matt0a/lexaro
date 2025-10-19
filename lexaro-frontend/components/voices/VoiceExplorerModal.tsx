'use client';
import { useMemo, useRef, useState } from 'react';
import { X, Play, Pause } from 'lucide-react';
import Image from 'next/image';
import type { VoiceMeta } from './VoicePickerModal';

type ExplorerProps = {
    open: boolean;
    onClose: () => void;
    onPick: (v: VoiceMeta) => void;
    voices: VoiceMeta[];
    language?: string; // e.g., 'English'
    region?: string;   // e.g., 'United States'
};

const CATEGORIES = ['All Voices','Favorites','Professional','Narration','Conversational','Educational','Acting','Meditation'] as const;

export default function VoiceExplorerModal({ open, onClose, onPick, voices, language = 'English', region }: ExplorerProps) {
    const [tab, setTab] = useState<(typeof CATEGORIES)[number]>('All Voices');
    const [playing, setPlaying] = useState<string | null>(null);
    const audio = useRef<Record<string, HTMLAudioElement>>({});

    if (!open) return null;

    const filtered = useMemo(() => {
        let arr = voices;
        if (language) arr = arr.filter(v => v.language === language);
        if (region)   arr = arr.filter(v => v.region === region);
        // simple category routing by attitude (you can refine)
        switch (tab) {
            case 'Professional':  return arr.filter(v => (v.attitude ?? '').toLowerCase().includes('professional'));
            case 'Narration':     return arr.filter(v => (v.attitude ?? '').toLowerCase().includes('narr'));
            case 'Conversational':return arr.filter(v => (v.attitude ?? '').toLowerCase().includes('friendly') || (v.attitude ?? '').toLowerCase().includes('convers'));
            case 'Educational':   return arr.filter(v => (v.attitude ?? '').toLowerCase().includes('educ'));
            case 'Acting':        return arr.filter(v => (v.attitude ?? '').toLowerCase().includes('dynamic') || (v.attitude ?? '').toLowerCase().includes('acting'));
            case 'Meditation':    return arr.filter(v => (v.attitude ?? '').toLowerCase().includes('calm'));
            case 'Favorites':     return arr.filter(v => v.favorite);
            default:              return arr;
        }
    }, [voices, language, region, tab]);

    const toggle = (id: string, src?: string) => {
        if (!src) return;
        if (!audio.current[id]) {
            const a = new Audio(src);
            a.preload = 'auto';
            a.addEventListener('ended', () => setPlaying(p => (p === id ? null : p)));
            audio.current[id] = a;
        }
        Object.entries(audio.current).forEach(([k, a]) => {
            if (k !== id) { try { a.pause(); a.currentTime = 0; } catch {} }
        });
        const a = audio.current[id];
        if (playing === id && !a.paused) { a.pause(); setPlaying(null); }
        else { a.currentTime = 0; a.play().catch(() => {}); setPlaying(id); }
    };

    return (
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/80" onClick={onClose} />
            <div className="absolute inset-0 flex flex-col p-4">
                <div className="rounded-2xl border border-white/10 bg-black shadow-2xl flex-1 flex overflow-hidden">
                    {/* left column / header */}
                    <div className="flex-1 flex flex-col">
                        {/* top bar */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                            <div className="text-white/80 text-sm">
                                <span className="opacity-70">{language}</span>
                                {region ? <span className="opacity-70"> · {region}</span> : null}
                            </div>
                            <button onClick={onClose} className="rounded-md p-1 hover:bg-white/5">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* tabs */}
                        <div className="px-4 py-3 flex items-center gap-2 overflow-x-auto border-b border-white/10">
                            {CATEGORIES.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setTab(c)}
                                    className={[
                                        'rounded-full px-3 py-1.5 text-sm whitespace-nowrap border',
                                        tab === c ? 'border-accent bg-accent text-white' : 'border-white/15 bg-white/5 hover:bg-white/10 text-white/85'
                                    ].join(' ')}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>

                        {/* grid */}
                        <div className="flex-1 overflow-y-auto p-5">
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                                {filtered.map(v => {
                                    const active = playing === v.id;
                                    return (
                                        <div key={v.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 hover:bg-white/[0.05] transition">
                                            <div className="flex items-center gap-3">
                                                <div className="h-12 w-12 rounded-full overflow-hidden border border-white/10 bg-white/[0.05] grid place-items-center">
                                                    {v.avatar ? <Image src={v.avatar} alt={v.title} width={48} height={48} /> : <span>{v.flagEmoji ?? '🎙️'}</span>}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-medium text-white/90 truncate">{v.title}</div>
                                                    <div className="text-xs text-white/60 truncate">
                                                        {v.language}{v.region ? ` · ${v.region}` : ''}{v.attitude ? ` · ${v.attitude}` : ''}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex items-center justify-between gap-2">
                                                <button
                                                    onClick={() => toggle(v.id, v.preview)}
                                                    className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-sm font-semibold bg-white/5 hover:bg-white/10"
                                                >
                                                    {active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                                    {active ? 'Pause' : 'Play'}
                                                </button>
                                                <button
                                                    onClick={() => onPick(v)}
                                                    className="rounded-md border border-accent bg-accent px-3 py-1.5 text-xs font-semibold text-white"
                                                >
                                                    Select Voice
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {filtered.length === 0 && (
                                <div className="py-16 text-center text-white/60">No voices in this category yet.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
