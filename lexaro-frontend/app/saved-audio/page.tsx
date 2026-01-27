'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Sidebar from '@/components/dashboard/Sidebar';
import api from '@/lib/api';
import { Trash2, RefreshCcw, FileAudio2, ArrowUpRight } from 'lucide-react';
import AudioPlayer from '@/components/audio/AudioPlayer';

// Landing background
import LightPillarsBackground from '@/components/reactbits/LightPillarsBackground';

type PageResp<T> = {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
};

type DocumentResponse = {
    id: number;
    filename: string;
    mime: string;
    sizeBytes: number;
    uploadedAt: string;
};

type PresignDownloadResponse = { url: string; ttlSeconds: number };

type SavedAudioItem = {
    doc: DocumentResponse;
    url: string;
    validUntil: number;
};

type UsageDto = {
    plan: string;
    unlimited: boolean;
    verified: boolean;
    monthlyCap: number;
    monthlyUsed: number;
    monthlyRemaining: number;
    dailyCap: number;
    dailyUsed: number;
    dailyRemaining: number;
};

function fmtBytes(b: number) {
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
    if (b < 1024 * 1024 * 1024) return (b / 1024 / 1024).toFixed(1) + ' MB';
    return (b / 1024 / 1024 / 1024).toFixed(1) + ' GB';
}

function planToMaxSpeed(plan?: string) {
    const p = (plan || '').toUpperCase();
    if (p.includes('PLUS')) return 10;
    if (p.includes('PREMIUM') || p.includes('BUSINESS')) return 3.5;
    return 1;
}

export default function SavedAudioPage() {
    const router = useRouter();

    const [logicalPage, setLogicalPage] = useState(0);
    const [hasNext, setHasNext] = useState(false);

    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<SavedAudioItem[]>([]);
    const [error, setError] = useState<string>('');

    const [maxSpeed, setMaxSpeed] = useState<number>(1);

    const pageSize = 12;
    const backendChunkSize = 50;

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const { data } = await api.get<UsageDto>('/me/usage');
                if (!alive) return;
                setMaxSpeed(planToMaxSpeed(data?.plan));
            } catch {
                // keep default
            }
        })();

        return () => {
            alive = false;
        };
    }, []);

    const loadLogicalPage = useCallback(
        async (lp: number) => {
            setLoading(true);
            setError('');
            try {
                const targetCount = (lp + 1) * pageSize;
                let ready: SavedAudioItem[] = [];

                let backendPage = 0;
                let totalDocPages = 1;

                const fetchDocs = async (p: number) => {
                    const { data } = await api.get<PageResp<DocumentResponse>>('/documents', {
                        // ✅ only AUDIO docs here
                        params: { page: p, size: backendChunkSize, sort: 'uploadedAt,DESC', purpose: 'AUDIO' },
                    });

                    totalDocPages = data.totalPages || 1;

                    const candidates = await Promise.all(
                        data.content.map(async (doc) => {
                            try {
                                const { data: presign } = await api.get<PresignDownloadResponse>(
                                    `/documents/${doc.id}/audio/download`,
                                    { params: { ttlSeconds: 300 } }
                                );

                                return {
                                    ok: true,
                                    item: {
                                        doc,
                                        url: presign.url,
                                        validUntil: Date.now() + (presign.ttlSeconds ?? 300) * 1000,
                                    } as SavedAudioItem,
                                };
                            } catch {
                                return { ok: false, item: null as any };
                            }
                        })
                    );

                    ready = ready.concat(candidates.filter((c) => c.ok).map((c) => c.item));
                };

                while (ready.length < targetCount && backendPage < totalDocPages) {
                    await fetchDocs(backendPage);
                    backendPage++;
                }

                let _hasNext = false;
                if (ready.length > targetCount) {
                    _hasNext = true;
                } else {
                    while (!_hasNext && backendPage < totalDocPages) {
                        await fetchDocs(backendPage);
                        backendPage++;
                        if (ready.length > targetCount) _hasNext = true;
                    }
                }

                const start = lp * pageSize;
                const end = start + pageSize;
                setItems(ready.slice(start, end));
                setHasNext(_hasNext);
                setLogicalPage(lp);
            } catch (e: any) {
                setError(e?.message || 'Failed to load saved audio.');
                setItems([]);
                setHasNext(false);
            } finally {
                setLoading(false);
            }
        },
        [pageSize, backendChunkSize]
    );

    useEffect(() => {
        loadLogicalPage(0);
    }, [loadLogicalPage]);

    const reloadFirst = () => loadLogicalPage(0);
    const goPrev = () => logicalPage > 0 && loadLogicalPage(logicalPage - 1);
    const goNext = () => hasNext && loadLogicalPage(logicalPage + 1);

    async function refreshLink(docId: number) {
        try {
            const { data } = await api.get<PresignDownloadResponse>(`/documents/${docId}/audio/download`, {
                params: { ttlSeconds: 300 },
            });

            setItems((curr) =>
                curr.map((it) =>
                    it.doc.id === docId
                        ? { ...it, url: data.url, validUntil: Date.now() + (data.ttlSeconds ?? 300) * 1000 }
                        : it
                )
            );
        } catch {
            setItems((curr) => curr.filter((it) => it.doc.id !== docId));
            reloadFirst();
        }
    }

    async function deleteDoc(docId: number) {
        await api.delete(`/documents/${docId}`);
        setItems((curr) => curr.filter((it) => it.doc.id !== docId));
        reloadFirst();
    }

    function openReadAlong(docId: number, filename: string) {
        const name = encodeURIComponent(filename);
        // ✅ This keeps your current read-along route intact:
        router.push(`/dashboard/saved-audio/${docId}?name=${name}`);
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <Sidebar />

            <main className="md:ml-56">
                {/* Landing-style scene */}
                <div className="relative overflow-hidden min-h-screen">
                    <div className="pointer-events-none absolute inset-0 -z-10">
                        <LightPillarsBackground />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/45" />
                        <div className="absolute inset-0 bg-vignette-strong opacity-100" />
                    </div>

                    <div className="px-4 md:px-6 py-10 max-w-6xl mx-auto relative">
                        <motion.header
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35 }}
                            className="mb-6 flex items-center justify-between gap-4"
                        >
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="h-9 w-9 rounded-2xl border border-white/10 bg-white/5 grid place-items-center">
                                        <FileAudio2 className="h-4 w-4 text-white/80" />
                                    </div>
                                    <h1 className="text-2xl font-semibold">Saved Audio</h1>
                                </div>
                                <p className="text-white/65 mt-2">
                                    Your 12 most recent audio files show here. Older files appear on the next pages.
                                </p>
                                <div className="section-rule" />
                            </div>

                            <button
                                onClick={reloadFirst}
                                className="btn-ghost border border-white/10 bg-white/5 hover:bg-white/10 rounded-2xl px-4 py-2"
                                type="button"
                            >
                                <RefreshCcw className="h-4 w-4" />
                                Refresh
                            </button>
                        </motion.header>

                        {loading && <div className="text-white/70">Loading…</div>}

                        {!loading && error && (
                            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                                {error}
                            </div>
                        )}

                        {!loading && !error && items.length === 0 && (
                            <div className="panel-auth relative overflow-hidden p-6">
                                <div className="panel-sheen" />
                                <h2 className="text-lg font-semibold">No saved audio yet</h2>
                                <p className="text-white/70 mt-2">
                                    Generate audio by uploading a document. Your files will appear here when available.
                                </p>
                                <Link
                                    href="/dashboard?open=upload"
                                    className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10 transition"
                                >
                                    Go to Uploads <ArrowUpRight className="h-4 w-4" />
                                </Link>
                            </div>
                        )}

                        {!loading && !error && items.length > 0 && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {items.map(({ doc, url, validUntil }, idx) => {
                                        const mp3Name = doc.filename.includes('.')
                                            ? doc.filename.replace(/\.[^.]+$/, '.mp3')
                                            : `${doc.filename}.mp3`;

                                        const secondsLeft = Math.max(0, Math.floor((validUntil - Date.now()) / 1000));
                                        const status =
                                            secondsLeft <= 10 ? 'Expiring' : secondsLeft <= 60 ? 'Expiring soon' : 'Ready';

                                        return (
                                            <motion.div
                                                key={doc.id}
                                                initial={{ opacity: 0, y: 12 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.28, delay: Math.min(0.18, idx * 0.03) }}
                                                whileHover={{ y: -2 }}
                                                className="panel-auth panel-auth-hover relative overflow-hidden p-5 cursor-pointer group"
                                                onClick={() => openReadAlong(doc.id, mp3Name)}
                                            >
                                                <div className="panel-sheen" />

                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                                                                <FileAudio2 className="h-4 w-4 text-white/75" />
                                                            </div>

                                                            <div className="min-w-0">
                                                                <div className="font-semibold text-white/90 truncate">{mp3Name}</div>
                                                                <div className="mt-2 flex flex-wrap gap-2">
                                                                    <span className="chip">MP3</span>
                                                                    <span className="chip">{fmtBytes(doc.sizeBytes)}</span>
                                                                    <span className="chip">{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                                                                    <span className={status === 'Ready' ? 'chip-accent' : 'chip'}>
                                                                        {status}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteDoc(doc.id);
                                                        }}
                                                        className="p-2 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
                                                        title="Delete"
                                                        type="button"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>

                                                <div
                                                    className="mt-4"
                                                    onClick={(e) => e.stopPropagation()}
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                >
                                                    <AudioPlayer
                                                        src={url}
                                                        downloadHref={url}
                                                        onRefresh={() => refreshLink(doc.id)}
                                                        maxSpeed={maxSpeed}
                                                    />
                                                </div>

                                                <div className="mt-3 text-[11px] text-white/55">
                                                    Link valid ~ {secondsLeft}s (use “Refresh link” to renew)
                                                </div>
                                                <div className="mt-2 text-[11px] text-white/45">
                                                    Click card to open read-along
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>

                                <div className="flex items-center gap-2 mt-6">
                                    <button
                                        disabled={logicalPage === 0}
                                        onClick={goPrev}
                                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm disabled:opacity-50 hover:bg-white/10 transition"
                                    >
                                        Previous
                                    </button>

                                    <div className="text-sm text-white/60">Page {logicalPage + 1}</div>

                                    <button
                                        disabled={!hasNext}
                                        onClick={goNext}
                                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm disabled:opacity-50 hover:bg-white/10 transition"
                                    >
                                        Next
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
