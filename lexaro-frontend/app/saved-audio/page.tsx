'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/dashboard/Sidebar';
import api from '@/lib/api';
import { Download, Trash2, RefreshCcw } from 'lucide-react';

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
    url: string;        // presigned URL
    validUntil: number; // Date.now() + ttlSeconds*1000
};

function fmtBytes(b: number) {
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
    if (b < 1024 * 1024 * 1024) return (b / 1024 / 1024).toFixed(1) + ' MB';
    return (b / 1024 / 1024 / 1024).toFixed(1) + ' GB';
}

export default function SavedAudioPage() {
    // "Logical" pagination over *downloadable audios*, not raw documents
    const [logicalPage, setLogicalPage] = useState(0);
    const [hasNext, setHasNext] = useState(false);

    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<SavedAudioItem[]>([]);
    const [error, setError] = useState<string>('');

    // How many to show per page (your request: 12 most recent)
    const pageSize = 12;

    // When building a logical page, we fetch documents in large chunks to reduce round-trips.
    // 50 is a good balance; adjust if you want.
    const backendChunkSize = 50;

    // Build a logical page of downloadable items:
    // - Accumulate newest-first docs across backend pages
    // - Keep only those that successfully presign /audio/download
    // - Slice to the requested logicalPage window
    const loadLogicalPage = useCallback(async (lp: number) => {
        setLoading(true);
        setError('');
        try {
            const targetCount = (lp + 1) * pageSize; // how many downloadable we need to discover to fill up to this page
            let ready: SavedAudioItem[] = [];

            // fetch first page to learn totalPages
            let backendPage = 0;
            let totalDocPages = 1;

            const fetchDocs = async (p: number) => {
                const { data } = await api.get<PageResp<DocumentResponse>>('/documents', {
                    params: { page: p, size: backendChunkSize, sort: 'uploadedAt,DESC' },
                });
                totalDocPages = data.totalPages || 1;

                // try presign for each doc
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

                // keep only downloadable
                ready = ready.concat(candidates.filter(c => c.ok).map(c => c.item));
            };

            // Fetch backend pages until we have enough downloadable items to fill the requested logical page
            while (ready.length < targetCount && backendPage < totalDocPages) {
                await fetchDocs(backendPage);
                backendPage++;
            }

            // Determine if there's at least one more downloadable beyond current window
            let _hasNext = false;
            if (ready.length > targetCount) {
                _hasNext = true;
            } else {
                // If we exactly filled targetCount, check subsequent backend pages for at least one more downloadable
                while (!_hasNext && backendPage < totalDocPages) {
                    await fetchDocs(backendPage);
                    backendPage++;
                    if (ready.length > targetCount) _hasNext = true;
                }
            }

            // Slice window for requested logical page
            const start = lp * pageSize;
            const end = start + pageSize;
            const windowItems = ready.slice(start, end);

            setItems(windowItems);
            setHasNext(_hasNext);
            setLogicalPage(lp);
        } catch (e: any) {
            setError(e?.message || 'Failed to load saved audio.');
            setItems([]);
            setHasNext(false);
        } finally {
            setLoading(false);
        }
    }, [pageSize, backendChunkSize]);

    // Start at logical page 0 (12 most recent downloadable audios)
    useEffect(() => {
        loadLogicalPage(0);
    }, [loadLogicalPage]);

    const reloadFirst = () => loadLogicalPage(0);
    const goPrev = () => { if (logicalPage > 0) loadLogicalPage(logicalPage - 1); };
    const goNext = () => { if (hasNext) loadLogicalPage(logicalPage + 1); };

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
            // if refresh fails, remove it and compact to first page
            setItems((curr) => curr.filter((it) => it.doc.id !== docId));
            reloadFirst();
        }
    }

    async function deleteDoc(docId: number) {
        await api.delete(`/documents/${docId}`);
        // Optimistic remove, then compact to page 1 again
        setItems((curr) => curr.filter((it) => it.doc.id !== docId));
        reloadFirst();
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <Sidebar />
            <main className="ml-56">
                {/* top vignette */}
                <div className="relative overflow-hidden">
                    <div className="pointer-events-none absolute -inset-x-24 -top-32 h-48 bg-[radial-gradient(700px_250px_at_50%_0%,rgba(255,255,255,.06),transparent)]" />
                </div>

                <div className="px-6 py-10 max-w-6xl mx-auto">
                    <header className="mb-4 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold">Saved Audio</h1>
                            <p className="text-white/70 mt-1">
                                The 12 most recent audios are shown here. Older files appear on the next pages.
                            </p>
                        </div>
                        <button
                            onClick={reloadFirst}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
                        >
                            <RefreshCcw className="h-4 w-4" />
                            Refresh
                        </button>
                    </header>

                    {loading && <div className="text-white/70">Loading…</div>}

                    {!loading && error && (
                        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
                    )}

                    {!loading && !error && items.length === 0 && (
                        <div className="flex flex-col items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-6">
                            <h2 className="text-lg font-medium">No saved audio yet</h2>
                            <p className="text-white/70">
                                Generate audio by uploading a document. Your files will appear here until they expire.
                            </p>
                            <Link
                                href="/dashboard?open=upload"
                                className="inline-flex items-center rounded-2xl border border-transparent bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15"
                            >
                                Go to Uploads
                            </Link>
                        </div>
                    )}

                    {!loading && !error && items.length > 0 && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {items.map(({ doc, url, validUntil }) => {
                                    const mp3Name =
                                        doc.filename.includes('.') ? doc.filename.replace(/\.[^.]+$/, '.mp3') : `${doc.filename}.mp3`;
                                    const secondsLeft = Math.max(0, Math.floor((validUntil - Date.now()) / 1000));
                                    return (
                                        <div
                                            key={doc.id}
                                            className="card p-4 space-y-3 bg-white/[0.03] border border-white/10 rounded-2xl"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="font-medium">{mp3Name}</div>
                                                    <div className="text-xs text-white/60">
                                                        Source size: {fmtBytes(doc.sizeBytes)} • Uploaded {new Date(doc.uploadedAt).toLocaleString()}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => deleteDoc(doc.id)}
                                                    className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => refreshLink(doc.id)}
                                                        className="btn-ghost flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
                                                    >
                                                        <Download className="h-4 w-4" /> Get fresh link
                                                    </button>
                                                    <a
                                                        href={url}
                                                        target="_blank"
                                                        className="btn-accent rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15"
                                                    >
                                                        Open
                                                    </a>
                                                </div>
                                                <audio controls src={url} className="w-full" />
                                                <div className="text-[11px] text-white/50">
                                                    Link valid ~ {secondsLeft}s (click “Get fresh link” to renew)
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* logical pager */}
                            <div className="flex items-center gap-2 mt-6">
                                <button
                                    disabled={logicalPage === 0}
                                    onClick={goPrev}
                                    className="btn-ghost rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-white/10"
                                >
                                    Previous
                                </button>
                                <div className="text-sm text-white/60">Page {logicalPage + 1}</div>
                                <button
                                    disabled={!hasNext}
                                    onClick={goNext}
                                    className="btn-ghost rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-white/10"
                                >
                                    Next
                                </button>
                            </div>
                        </>
                    )}

                    {/* bottom vignette */}
                    <div className="pointer-events-none mt-16 h-40 bg-[radial-gradient(700px_250px_at_50%_100%,rgba(255,255,255,.05),transparent)]" />
                </div>
            </main>
        </div>
    );
}
