'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export type AudioStatusResponse = {
    status: 'PENDING' | 'PROCESSING' | 'READY' | 'ERROR';
    voice?: string | null;
    format?: string | null;
    url?: string | null;   // only present when READY (from controller)
    error?: string | null;
};

export type PresignDownloadResponse = {
    url: string;
    ttlSeconds: number;
};

type Props = { docId: number };

export default function AudioStatus({ docId }: Props) {
    const [data, setData] = useState<AudioStatusResponse | null>(null);
    const [downUrl, setDownUrl] = useState<string>('');

    useEffect(() => {
        let active = true;

        async function poll() {
            // Use Axios generic to avoid data: unknown
            const res = await api.get<AudioStatusResponse>(`/documents/${docId}/audio`, {
                validateStatus: () => true, // allow 202
            });

            if (!active) return;

            setData(res.data);

            if (res.status === 202) {
                const retryAfterHeader = (res.headers as Record<string, string | number | undefined>)['retry-after'];
                const retryAfter = Number(retryAfterHeader ?? 3);
                setTimeout(poll, Number.isFinite(retryAfter) ? retryAfter * 1000 : 3000);
            }
        }

        poll();
        return () => { active = false; };
    }, [docId]);

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
            <div>Status: <span className="font-medium">{data.status}</span></div>

            {data.status === 'READY' ? (
                <div className="mt-3 space-y-2">
                    <button onClick={refreshDownload} className="btn-ghost">Get download link</button>
                    {downUrl && (
                        <>
                            <a className="text-accent underline block" href={downUrl} target="_blank">Open audio</a>
                            <audio controls src={downUrl} className="w-full mt-2" />
                        </>
                    )}
                </div>
            ) : (
                <div className="mt-2 text-white/70 text-sm">Processing… this can take a moment.</div>
            )}
        </div>
    );
}
