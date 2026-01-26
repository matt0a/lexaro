'use client';

import { useState } from 'react';
import {
    indexEducationDocument,
    searchEducationChunks,
    ChunkSearchResponse,
} from '@/lib/educationApi';

export default function EducationDocSourcesPage({ params }: { params: { id: string } }) {
    const docId = Number(params.id);

    const [indexing, setIndexing] = useState(false);
    const [indexed, setIndexed] = useState<{ pageCount: number; chunkCount: number } | null>(null);

    const [q, setQ] = useState('');
    const [searching, setSearching] = useState(false);
    const [resp, setResp] = useState<ChunkSearchResponse | null>(null);
    const [error, setError] = useState('');

    const runIndex = async () => {
        setError('');
        setIndexing(true);
        try {
            const r = await indexEducationDocument(docId);
            setIndexed({ pageCount: r.pageCount, chunkCount: r.chunkCount });
        } catch (e: any) {
            setError(e?.response?.data?.message || 'Index failed.');
        } finally {
            setIndexing(false);
        }
    };

    const runSearch = async () => {
        setError('');
        setSearching(true);
        try {
            const r = await searchEducationChunks(docId, q, { limit: 8 });
            setResp(r);
        } catch (e: any) {
            setError(e?.response?.data?.message || 'Search failed.');
        } finally {
            setSearching(false);
        }
    };

    return (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="font-semibold">Sources (Index + Chunk Search)</div>
                    <div className="text-sm text-white/60 mt-1">
                        This is your MVP pipeline. Index first, then search chunks.
                    </div>
                </div>

                <button
                    onClick={runIndex}
                    disabled={indexing}
                    className="px-4 py-2 rounded-xl bg-[#009FFD] text-black font-semibold hover:opacity-90 transition disabled:opacity-60"
                >
                    {indexing ? 'Indexing…' : 'Index Document'}
                </button>
            </div>

            {indexed && (
                <div className="mt-4 text-sm text-white/70">
                    Indexed: <span className="text-white">{indexed.chunkCount}</span> chunks ·{' '}
                    <span className="text-white">{indexed.pageCount}</span> pages
                </div>
            )}

            <div className="mt-6">
                <div className="font-semibold">Chunk Search</div>
                <div className="text-sm text-white/60 mt-1">
                    Try queries like: “mitochondria”, “photosynthesis”, “definition of…”
                </div>

                <div className="mt-4 flex gap-3">
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search query…"
                        className="flex-1 px-4 py-2 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-white/25"
                    />
                    <button
                        onClick={runSearch}
                        disabled={searching || !q.trim()}
                        className="px-4 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 transition disabled:opacity-60"
                    >
                        {searching ? 'Searching…' : 'Search'}
                    </button>
                </div>

                {error && <div className="mt-4 text-sm text-red-300">{error}</div>}

                {resp && (
                    <div className="mt-6 space-y-3">
                        {resp.results.length === 0 ? (
                            <div className="text-sm text-white/60">No matches.</div>
                        ) : (
                            resp.results.map((r) => (
                                <div key={r.chunkId} className="rounded-xl bg-black/30 border border-white/10 p-4">
                                    <div className="text-xs text-white/60">
                                        Chunk #{r.chunkId} · Pages {r.pageStart ?? '?'}–{r.pageEnd ?? '?'} · score{' '}
                                        {r.score.toFixed(1)}
                                    </div>
                                    <div className="mt-2 text-sm text-white/80">{r.snippet}</div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
