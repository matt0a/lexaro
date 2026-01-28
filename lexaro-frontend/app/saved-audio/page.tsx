'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Sidebar from '@/components/dashboard/Sidebar';
import api from '@/lib/api';
import {
    Trash2,
    RefreshCcw,
    FileAudio2,
    ArrowUpRight,
    Search,
    Headphones,
    Clock,
    HardDrive,
    Play,
    Download,
    ChevronLeft,
    ChevronRight,
    Music,
    Mic2,
} from 'lucide-react';
import AudioPlayer from '@/components/audio/AudioPlayer';
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

/**
 * Format bytes to human readable string.
 */
function fmtBytes(b: number) {
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
    if (b < 1024 * 1024 * 1024) return (b / 1024 / 1024).toFixed(1) + ' MB';
    return (b / 1024 / 1024 / 1024).toFixed(1) + ' GB';
}

/**
 * Get max playback speed based on plan.
 */
function planToMaxSpeed(plan?: string) {
    const p = (plan || '').toUpperCase();
    if (p.includes('PLUS')) return 10;
    if (p.includes('PREMIUM') || p.includes('BUSINESS')) return 3.5;
    return 1;
}

/**
 * Format time ago from date.
 */
function timeAgo(date: Date) {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
}

/**
 * Saved Audio Page
 *
 * Displays all generated audio files with playback controls.
 * Features:
 * - Audio player with speed control
 * - Search filtering
 * - Pagination
 * - Link refresh and deletion
 * - Read-along navigation
 */
export default function SavedAudioPage() {
    const router = useRouter();

    const [logicalPage, setLogicalPage] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const [totalCount, setTotalCount] = useState(0);

    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<SavedAudioItem[]>([]);
    const [error, setError] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');

    const [maxSpeed, setMaxSpeed] = useState<number>(1);
    const [deleting, setDeleting] = useState<number | null>(null);

    const pageSize = 12;
    const backendChunkSize = 50;

    // Load user plan for max speed
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

    /**
     * Load audio items for a logical page.
     */
    const loadLogicalPage = useCallback(
        async (lp: number) => {
            setLoading(true);
            setError('');
            try {
                const targetCount = (lp + 1) * pageSize;
                let ready: SavedAudioItem[] = [];

                let backendPage = 0;
                let totalDocPages = 1;
                let totalElements = 0;

                const fetchDocs = async (p: number) => {
                    const { data } = await api.get<PageResp<DocumentResponse>>('/documents', {
                        params: { page: p, size: backendChunkSize, sort: 'uploadedAt,DESC', purpose: 'AUDIO' },
                    });

                    totalDocPages = data.totalPages || 1;
                    totalElements = data.totalElements || 0;

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
                setTotalCount(totalElements);
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

    /**
     * Refresh presigned URL for an audio file.
     */
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

    /**
     * Delete an audio document.
     */
    async function deleteDoc(docId: number) {
        setDeleting(docId);
        try {
            await api.delete(`/documents/${docId}`);
            setItems((curr) => curr.filter((it) => it.doc.id !== docId));
            reloadFirst();
        } finally {
            setDeleting(null);
        }
    }

    /**
     * Open read-along player for a document.
     */
    function openReadAlong(docId: number, filename: string) {
        const name = encodeURIComponent(filename);
        router.push(`/dashboard/saved-audio/${docId}?name=${name}`);
    }

    // Filter items by search
    const filteredItems = items.filter((item) =>
        item.doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Calculate total storage
    const totalStorage = items.reduce((sum, item) => sum + item.doc.sizeBytes, 0);

    return (
        <div className="min-h-screen bg-black text-white">
            <Sidebar />

            <main className="md:ml-56">
                <div className="relative overflow-hidden min-h-screen">
                    {/* Background */}
                    <div className="pointer-events-none absolute inset-0 -z-10">
                        <LightPillarsBackground />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/45" />
                        <div className="absolute inset-0 bg-vignette-strong opacity-100" />
                    </div>

                    <div className="px-4 md:px-6 py-8 max-w-6xl mx-auto relative">
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35 }}
                            className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 grid place-items-center shadow-lg shadow-cyan-500/20">
                                    <Headphones className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-2xl font-bold">Saved Audio</h1>
                                        {totalCount > 0 && (
                                            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-medium">
                                                {totalCount} {totalCount === 1 ? 'file' : 'files'}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-white/60 text-sm mt-1">
                                        Your generated audio files ready to play
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={reloadFirst}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10
                                               hover:bg-white/10 transition-colors disabled:opacity-50"
                                    type="button"
                                >
                                    <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                    Refresh
                                </button>
                                <Link
                                    href="/dashboard?open=upload"
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500
                                               text-white font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
                                >
                                    <Mic2 className="h-4 w-4" />
                                    Create New
                                </Link>
                            </div>
                        </motion.div>

                        {/* Stats Row */}
                        {!loading && items.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35, delay: 0.05 }}
                                className="grid grid-cols-3 gap-4 mb-6"
                            >
                                <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                                            <Music className="h-5 w-5 text-cyan-400" />
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold">{items.length}</div>
                                            <div className="text-xs text-white/50">On This Page</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                            <HardDrive className="h-5 w-5 text-blue-400" />
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold">{fmtBytes(totalStorage)}</div>
                                            <div className="text-xs text-white/50">Total Size</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                            <Play className="h-5 w-5 text-purple-400" />
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold">{maxSpeed}x</div>
                                            <div className="text-xs text-white/50">Max Speed</div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Search Bar */}
                        {!loading && items.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35, delay: 0.1 }}
                                className="mb-6"
                            >
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                                    <input
                                        type="text"
                                        placeholder="Search audio files..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10
                                                   text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/50
                                                   transition-colors"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Loading State */}
                        {loading && (
                            <div className="flex items-center justify-center py-20">
                                <div className="flex items-center gap-3 text-white/60">
                                    <div className="h-5 w-5 border-2 border-white/20 border-t-cyan-500 rounded-full animate-spin" />
                                    Loading audio files...
                                </div>
                            </div>
                        )}

                        {/* Error State */}
                        {!loading && error && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center"
                            >
                                <p className="text-red-200">{error}</p>
                                <button
                                    onClick={reloadFirst}
                                    className="mt-4 px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 transition-colors"
                                >
                                    Try Again
                                </button>
                            </motion.div>
                        )}

                        {/* Empty State */}
                        {!loading && !error && items.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35 }}
                                className="rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 p-12 text-center"
                            >
                                <div className="mx-auto h-20 w-20 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center mb-6">
                                    <FileAudio2 className="h-10 w-10 text-cyan-400" />
                                </div>
                                <h2 className="text-xl font-semibold mb-2">No saved audio yet</h2>
                                <p className="text-white/60 mb-6 max-w-md mx-auto">
                                    Generate audio by uploading a document. Your files will appear here when ready.
                                </p>
                                <Link
                                    href="/dashboard?open=upload"
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500
                                               text-white font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
                                >
                                    Go to Uploads
                                    <ArrowUpRight className="h-4 w-4" />
                                </Link>
                            </motion.div>
                        )}

                        {/* Audio Grid */}
                        {!loading && !error && filteredItems.length > 0 && (
                            <>
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.35, delay: 0.15 }}
                                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                                >
                                    {filteredItems.map(({ doc, url, validUntil }, idx) => {
                                        const mp3Name = doc.filename.includes('.')
                                            ? doc.filename.replace(/\.[^.]+$/, '.mp3')
                                            : `${doc.filename}.mp3`;

                                        const secondsLeft = Math.max(0, Math.floor((validUntil - Date.now()) / 1000));
                                        const isExpiring = secondsLeft <= 60;
                                        const uploadDate = new Date(doc.uploadedAt);

                                        return (
                                            <motion.div
                                                key={doc.id}
                                                initial={{ opacity: 0, y: 12 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.28, delay: Math.min(0.18, idx * 0.03) }}
                                                className="group rounded-2xl bg-white/5 border border-white/10 p-5
                                                           hover:bg-white/[0.08] hover:border-cyan-500/30 transition-all"
                                            >
                                                {/* Card Header */}
                                                <div className="flex items-start justify-between gap-3 mb-4">
                                                    <div
                                                        className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                                                        onClick={() => openReadAlong(doc.id, mp3Name)}
                                                    >
                                                        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
                                                            <FileAudio2 className="h-5 w-5 text-cyan-400" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-semibold text-white/90 truncate group-hover:text-cyan-400 transition-colors">
                                                                {mp3Name}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-400 text-[10px] font-medium">
                                                                    MP3
                                                                </span>
                                                                <span className="text-xs text-white/50">
                                                                    {fmtBytes(doc.sizeBytes)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => deleteDoc(doc.id)}
                                                        disabled={deleting === doc.id}
                                                        className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/30
                                                                   transition-all opacity-0 group-hover:opacity-100"
                                                        title="Delete"
                                                        type="button"
                                                    >
                                                        {deleting === doc.id ? (
                                                            <div className="h-4 w-4 border-2 border-white/20 border-t-red-500 rounded-full animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-4 w-4 text-white/60 hover:text-red-400" />
                                                        )}
                                                    </button>
                                                </div>

                                                {/* Audio Player */}
                                                <div
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

                                                {/* Card Footer */}
                                                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                                                    <div className="flex items-center gap-1 text-xs text-white/40">
                                                        <Clock className="h-3 w-3" />
                                                        {timeAgo(uploadDate)}
                                                    </div>
                                                    <div className={`text-xs ${isExpiring ? 'text-amber-400' : 'text-white/40'}`}>
                                                        Link: {secondsLeft}s
                                                    </div>
                                                </div>

                                                {/* Read-along hint */}
                                                <button
                                                    onClick={() => openReadAlong(doc.id, mp3Name)}
                                                    className="mt-3 w-full py-2 rounded-lg bg-white/5 text-xs text-white/50
                                                               hover:bg-cyan-500/20 hover:text-cyan-400 transition-colors
                                                               flex items-center justify-center gap-2"
                                                >
                                                    <Play className="h-3 w-3" />
                                                    Open Read-Along Player
                                                </button>
                                            </motion.div>
                                        );
                                    })}
                                </motion.div>

                                {/* Pagination */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="flex items-center justify-center gap-4 mt-8"
                                >
                                    <button
                                        disabled={logicalPage === 0}
                                        onClick={goPrev}
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10
                                                   disabled:opacity-30 hover:bg-white/10 transition-colors"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Previous
                                    </button>

                                    <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm">
                                        Page <span className="font-semibold text-cyan-400">{logicalPage + 1}</span>
                                    </div>

                                    <button
                                        disabled={!hasNext}
                                        onClick={goNext}
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10
                                                   disabled:opacity-30 hover:bg-white/10 transition-colors"
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </motion.div>
                            </>
                        )}

                        {/* No Search Results */}
                        {!loading && !error && items.length > 0 && filteredItems.length === 0 && (
                            <div className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center">
                                <Search className="h-10 w-10 text-white/30 mx-auto mb-4" />
                                <h3 className="font-semibold mb-2">No matching audio files</h3>
                                <p className="text-white/60 text-sm">
                                    Try a different search term or{' '}
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="text-cyan-400 hover:underline"
                                    >
                                        clear the search
                                    </button>
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
