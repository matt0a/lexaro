'use client';
import { useEffect, useState } from 'react';

type Props = {
    onSelect: (docId: number) => void;
};

export default function TrackDocument({ onSelect }: Props) {
    const [input, setInput] = useState<string>('');

    // preload last tracked doc id from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('dashboard.lastDocId');
        if (saved) setInput(saved);
    }, []);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const id = Number(input);
        if (!Number.isFinite(id) || id <= 0) return;
        localStorage.setItem('dashboard.lastDocId', String(id));
        onSelect(id);
    };

    return (
        <form onSubmit={submit} className="card p-4 flex items-end gap-3">
            <div className="flex-1">
                <label className="block text-sm text-white/70 mb-1">Document ID</label>
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="e.g., 123"
                    inputMode="numeric"
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-accent"
                />
            </div>
            <button type="submit" className="btn-accent">Track</button>
        </form>
    );
}
