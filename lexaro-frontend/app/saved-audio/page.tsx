"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import api from "@/lib/api";
import { Trash2, RefreshCcw, FileAudio2 } from "lucide-react";
import AudioPlayer from "@/components/audio/AudioPlayer";

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
    if (b < 1024) return b + " B";
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
    if (b < 1024 * 1024 * 1024) return (b / 1024 / 1024).toFixed(1) + " MB";
    return (b / 1024 / 1024 / 1024).toFixed(1) + " GB";
}

function planToMaxSpeed(plan?: string) {
    const p = (plan || "").toUpperCase();
    // Handles PREMIUM_PLUS / BUSINESS_PLUS etc.
    if (p.includes("PLUS")) return 10;
    if (p.includes("PREMIUM") || p.includes("BUSINESS")) return 3.5;
    return 1;
}

export default function SavedAudioPage() {
    const router = useRouter();

    const [logicalPage, setLogicalPage] = useState(0);
    const [hasNext, setHasNext] = useState(false);

    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<SavedAudioItem[]>([]);
    const [error, setError] = useState<string>("");

    const [maxSpeed, setMaxSpeed] = useState<number>(1);

    const pageSize = 12;
    const backendChunkSize = 50;

    // Load max speed from authenticated profile (server truth)
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const { data } = await api.get<UsageDto>("/me/usage");
                if (!alive) return;
                setMaxSpeed(planToMaxSpeed(data?.plan));
            } catch {
                // keep default 1x if something goes wrong
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    const loadLogicalPage = useCallback(
        async (lp: number) => {
            setLoading(true);
            setError("");
            try {
                const targetCount = (lp + 1) * pageSize;
                let ready: SavedAudioItem[] = [];

                let backendPage = 0;
                let totalDocPages = 1;

                const fetchDocs = async (p: number) => {
                    const { data } = await api.get<PageResp<DocumentResponse>>("/documents", {
                        params: { page: p, size: backendChunkSize, sort: "uploadedAt,DESC" },
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
                const windowItems = ready.slice(start, end);

                setItems(windowItems);
                setHasNext(_hasNext);
                setLogicalPage(lp);
            } catch (e: any) {
                setError(e?.message || "Failed to load saved audio.");
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
    const goPrev = () => {
        if (logicalPage > 0) loadLogicalPage(logicalPage - 1);
    };
    const goNext = () => {
        if (hasNext) loadLogicalPage(logicalPage + 1);
    };

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
        router.push(`/dashboard/saved-audio/${docId}?name=${name}`);
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <Sidebar />
            <main className="ml-56">
                {/* top vignette */}
                <div className="relative overflow-hidden">
                    <div className="pointer-events-none absolute -inset-x-24 -top-32 h-48 bg-[radial-gradient(700px_250px_at_50%_0%,rgba(255,255,255,.06),transparent)]" />
                    <div className="pointer-events-none absolute inset-0">
                        <div className="absolute left-1/2 top-12 h-[520px] w-[980px] -translate-x-1/2 rounded-full bg-sky-500/10 blur-3xl" />
                        <div className="absolute left-1/3 top-44 h-[420px] w-[840px] -translate-x-1/2 rounded-full bg-fuchsia-500/10 blur-3xl" />
                    </div>
                </div>

                <div className="px-6 py-10 max-w-6xl mx-auto relative">
                    <header className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold">Saved Audio</h1>
                            <p className="text-white/70 mt-1">
                                Your 12 most recent audio files show here. Older files appear on the next pages.
                            </p>
                        </div>

                        <button
                            onClick={reloadFirst}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition"
                        >
                            <RefreshCcw className="h-4 w-4" />
                            Refresh
                        </button>
                    </header>

                    {loading && <div className="text-white/70">Loading…</div>}

                    {!loading && error && (
                        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                            {error}
                        </div>
                    )}

                    {!loading && !error && items.length === 0 && (
                        <div className="flex flex-col items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-6">
                            <h2 className="text-lg font-medium">No saved audio yet</h2>
                            <p className="text-white/70">
                                Generate audio by uploading a document. Your files will appear here when available.
                            </p>
                            <Link
                                href="/dashboard?open=upload"
                                className="inline-flex items-center rounded-2xl border border-transparent bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15 transition"
                            >
                                Go to Uploads
                            </Link>
                        </div>
                    )}

                    {!loading && !error && items.length > 0 && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {items.map(({ doc, url, validUntil }) => {
                                    const mp3Name = doc.filename.includes(".")
                                        ? doc.filename.replace(/\.[^.]+$/, ".mp3")
                                        : `${doc.filename}.mp3`;

                                    const secondsLeft = Math.max(0, Math.floor((validUntil - Date.now()) / 1000));

                                    return (
                                        <div
                                            key={doc.id}
                                            onClick={() => openReadAlong(doc.id, mp3Name)}
                                            className={[
                                                "group cursor-pointer rounded-3xl border border-white/10",
                                                "bg-gradient-to-b from-white/[0.06] to-white/[0.03]",
                                                "backdrop-blur-md p-5",
                                                "shadow-[0_26px_90px_rgba(0,0,0,.65)]",
                                                "transition hover:-translate-y-0.5 hover:border-white/20",
                                            ].join(" ")}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                                                            <FileAudio2 className="h-4 w-4 text-white/75" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-semibold text-white/90 truncate">{mp3Name}</div>
                                                            <div className="text-xs text-white/60">
                                                                Source size: {fmtBytes(doc.sizeBytes)} • Uploaded{" "}
                                                                {new Date(doc.uploadedAt).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteDoc(doc.id);
                                                    }}
                                                    className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
                                                    title="Delete"
                                                    type="button"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>

                                            {/* Player (prevent card navigation when interacting) */}
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

                                            <div className="mt-3 text-[11px] text-white/50">
                                                Link valid ~ {secondsLeft}s (use “Refresh link” to renew)
                                            </div>

                                            <div className="mt-2 text-[11px] text-white/45">
                                                Click card to open read-along
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* pager */}
                            <div className="flex items-center gap-2 mt-6">
                                <button
                                    disabled={logicalPage === 0}
                                    onClick={goPrev}
                                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-white/10 transition"
                                >
                                    Previous
                                </button>
                                <div className="text-sm text-white/60">Page {logicalPage + 1}</div>
                                <button
                                    disabled={!hasNext}
                                    onClick={goNext}
                                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-white/10 transition"
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
