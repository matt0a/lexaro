'use client';
import { useEffect, useState } from 'react';
import { listVoices, Voice } from '@/lib/voices';

export default function VoicesList() {
    const [voices, setVoices] = useState<Voice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        listVoices().then(setVoices).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="card p-4">Loading voices…</div>;

    return (
        <div className="grid gap-3 sm:grid-cols-2">
            {voices.map(v => (
                <div key={v.name} className="card p-4">
                    <div className="font-medium">{v.name}</div>
                    <div className="text-white/70 text-sm">{v.language} • {v.gender}</div>
                    <div className="mt-1 text-xs text-white/50">Engines: {v.enginesSupported.join(', ') || '—'}</div>
                </div>
            ))}
        </div>
    );
}
