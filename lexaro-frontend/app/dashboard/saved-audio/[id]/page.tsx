"use client";

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import api from "@/lib/api";
import ReadAlongTwoLinePlayer from "@/components/audio/ReadAlongTwoLinePlayer";
import { ArrowLeft } from "lucide-react";

type PresignDownloadResponse = { url: string; ttlSeconds: number };

type DocumentTextResponse = {
    documentId: number;
    mime: string;
    charCount: number;
    truncated: boolean;
    extractedAt: string;
    text: string;
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

function planToMaxSpeed(plan?: string) {
    const p = (plan || "").toUpperCase();
    if (p.includes("PLUS")) return 10;
    if (p.includes("PREMIUM") || p.includes("BUSINESS")) return 3.5;
    return 1;
}

export default function SavedAudioReadPage() {
    const params = useParams();
    const search = useSearchParams();
    const router = useRouter();

    const id = Number(params?.id);
    const titleFromQuery = search.get("name") || `Audio ${id}`;

    const [audioUrl, setAudioUrl] = useState<string>("");
    const [ttl, setTtl] = useState<number>(0);

    const [text, setText] = useState<string>("");

    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    const [maxSpeed, setMaxSpeed] = useState(1);

    async function refreshLink() {
        const { data } = await api.get<PresignDownloadResponse>(`/documents/${id}/audio/download`, {
            params: { ttlSeconds: 300 },
        });
        setAudioUrl(data.url);
        setTtl(data.ttlSeconds ?? 300);
    }

    useEffect(() => {
        if (!Number.isFinite(id) || id <= 0) return;

        let alive = true;

        async function load() {
            setLoading(true);
            setErr("");

            try {
                // plan → max speed
                const usage = await api.get<UsageDto>("/me/usage");
                if (alive) setMaxSpeed(planToMaxSpeed(usage.data?.plan));

                // audio link
                const presign = await api.get<PresignDownloadResponse>(`/documents/${id}/audio/download`, {
                    params: { ttlSeconds: 300 },
                });
                if (!alive) return;
                setAudioUrl(presign.data.url);
                setTtl(presign.data.ttlSeconds ?? 300);

                // transcript
                const tx = await api.get<DocumentTextResponse>(`/documents/${id}/text`, {
                    params: { maxPages: 0, maxChars: 0 },
                });
                if (!alive) return;
                setText(tx.data?.text ?? "");
            } catch (e: any) {
                if (!alive) return;
                setErr(e?.message || "Failed to load read-along.");
            } finally {
                if (alive) setLoading(false);
            }
        }

        load();
        return () => {
            alive = false;
        };
    }, [id]);

    return (
        <div className="min-h-screen bg-black text-white">
            <Sidebar />

            {/* shift content with sidebar width */}
            <main className="pl-[var(--sidebar-w)]">
                <div className="px-6 py-8">
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </button>

                    <div className="mt-5">
                        {loading ? (
                            <div className="text-white/70">Loading…</div>
                        ) : err ? (
                            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                                {err}
                            </div>
                        ) : (
                            <ReadAlongTwoLinePlayer
                                title={titleFromQuery}
                                src={audioUrl}
                                transcript={text}
                                downloadHref={audioUrl}
                                onRefresh={refreshLink}
                                maxSpeed={maxSpeed}
                            />
                        )}
                    </div>

                    <div className="mt-4 text-[11px] text-white/45">
                        Link TTL ~ {ttl}s (use “Refresh link” if it expires)
                    </div>
                </div>
            </main>
        </div>
    );
}
