'use client';

import { useEffect, useRef, useState } from 'react';
import api from '@/lib/api';

export type AudioStatusResponse = {
    status: 'PENDING' | 'PROCESSING' | 'READY' | 'ERROR';
    voice?: string | null;
    format?: string | null;
    url?: string | null; // optional (controller might include it)
    error?: string | null;
};

export type PresignDownloadResponse = {
    url: string;
    ttlSeconds: number;
};

type Props = {
    docId: number;
    /** Called once when status becomes READY */
    onReady?: (docId: number) => void;
};

export default function AudioStatus({ docId, onReady }: Props) {
    const [data, setData] = useState<AudioStatusResponse | null>(null);
    const [downUrl, setDownUrl] = useState<string>('');

    const navigatedRef = useRef(false);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        let active = true;

        function clearTimer() {
            if (timerRef.current != null) {
                window.clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        }

        async function poll() {
            try {
                const res = await api.get<AudioStatusResponse>(`/documents/${docId}/audio`, {
                    validateStatus: () => true, // allow 202 etc
                });

                if (!active) return;

                setData(res.data);

                const status = res.data?.status;

                // ✅ READY -> fire onReady once
                if (status === 'READY') {
                    clearTimer();
                    if (!navigatedRef.current) {
                        navigatedRef.current = true;
                        onReady?.(docId);
                    }
                    return;
                }

                // ✅ ERROR -> stop polling
                if (status === 'ERROR') {
                    clearTimer();
                    return;
                }

                // ✅ Keep polling while not READY/ERROR (even if HTTP 200)
                const retryAfterHeader = (res.headers as Record<string, string | number | undefined>)['retry-after'];
                const retryAfter = Number(retryAfterHeader ?? 3);
                const delayMs = Number.isFinite(retryAfter) ? Math.max(1, retryAfter) * 1000 : 3000;

                clearTimer();
                timerRef.current = window.setTimeout(poll, delayMs);
            } catch {
                if (!active) return;
                // network error: retry
                clearTimer();
                timerRef.current = window.setTimeout(poll, 3000);
            }
        }

        // reset per doc
        navigatedRef.current = false;
        setData(null);
        setDownUrl('');
        clearTimer();

        poll();

        return () => {
            active = false;
            clearTimer();
        };
    }, [docId, onReady]);

    async function refreshDownload() {
        const { data } = await api.get<PresignDownloadResponse>(`/documents/${docId}/audio/download`, {
            params: { ttlSeconds: 300 },
        });
        setDownUrl(data.url);
    }

    if (!data) return <div className="card p-4">Checking status…</div>;

    if (data.status === 'ERROR') {
        return <div className="card p-4 text-red-400">Error: {data.error || 'Unknown error'}</div>;
    }

    return (
        <div className="card p-4">
            <div>
                Status: <span className="font-medium">{data.status}</span>
            </div>

            {data.status === 'READY' ? (
                <div className="mt-2 text-white/70 text-sm">
                    Audio ready — opening reader…
                    {/* fallback UI if onReady isn't provided */}
                    {!onReady ? (
                        <div className="mt-3 space-y-2">
                            <button onClick={refreshDownload} className="btn-ghost">Get download link</button>
                            {downUrl && (
                                <>
                                    <a className="text-accent underline block" href={downUrl} target="_blank" rel="noreferrer">
                                        Open audio
                                    </a>
                                    <audio controls src={downUrl} className="w-full mt-2" />
                                </>
                            )}
                        </div>
                    ) : null}
                </div>
            ) : (
                <div className="mt-2 text-white/70 text-sm">Processing… this can take a moment.</div>
            )}
        </div>
    );
}
