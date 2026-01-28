'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import api from '@/lib/api';

export type AudioStatusResponse = {
    status: 'PENDING' | 'PROCESSING' | 'READY' | 'ERROR';
    voice?: string | null;
    format?: string | null;
    url?: string | null;
    error?: string | null;
};

export type PresignDownloadResponse = {
    url: string;
    ttlSeconds: number;
};

type Props = {
    docId: number;
    docName?: string;
    onReady?: (docId: number) => void;
};

export default function AudioStatus({ docId, docName, onReady }: Props) {
    const [data, setData] = useState<AudioStatusResponse | null>(null);
    const [downUrl, setDownUrl] = useState<string>('');
    const [elapsedSec, setElapsedSec] = useState(0);

    const navigatedRef = useRef(false);
    const timerRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(Date.now());

    // Elapsed time counter
    useEffect(() => {
        startTimeRef.current = Date.now();
        const interval = setInterval(() => {
            setElapsedSec(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [docId]);

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
                    validateStatus: () => true,
                });

                if (!active) return;

                setData(res.data);

                const status = res.data?.status;

                if (status === 'READY') {
                    clearTimer();
                    if (!navigatedRef.current) {
                        navigatedRef.current = true;
                        onReady?.(docId);
                    }
                    return;
                }

                if (status === 'ERROR') {
                    clearTimer();
                    return;
                }

                const retryAfterHeader = (res.headers as Record<string, string | number | undefined>)['retry-after'];
                const retryAfter = Number(retryAfterHeader ?? 3);
                const delayMs = Number.isFinite(retryAfter) ? Math.max(1, retryAfter) * 1000 : 3000;

                clearTimer();
                timerRef.current = window.setTimeout(poll, delayMs);
            } catch {
                if (!active) return;
                clearTimer();
                timerRef.current = window.setTimeout(poll, 3000);
            }
        }

        navigatedRef.current = false;
        setData(null);
        setDownUrl('');
        setElapsedSec(0);
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

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return m > 0 ? `${m}m ${s}s` : `${s}s`;
    };

    const status = data?.status;
    const isProcessing = !status || status === 'PENDING' || status === 'PROCESSING';
    const isReady = status === 'READY';
    const isError = status === 'ERROR';

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/20 p-5 backdrop-blur-sm"
        >
            <div className="flex items-center gap-4">
                {/* Status Icon */}
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isReady ? 'bg-green-500/20' : isError ? 'bg-red-500/20' : 'bg-amber-500/20'
                }`}>
                    {isProcessing && (
                        <Loader2 className="h-6 w-6 text-amber-400 animate-spin" />
                    )}
                    {isReady && (
                        <CheckCircle2 className="h-6 w-6 text-green-400" />
                    )}
                    {isError && (
                        <AlertCircle className="h-6 w-6 text-red-400" />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">
                            {isProcessing && 'Creating Audio'}
                            {isReady && 'Audio Ready'}
                            {isError && 'Error'}
                        </span>
                        {isProcessing && (
                            <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
                        )}
                    </div>

                    {docName && (
                        <p className="text-sm text-white/60 truncate mt-0.5">{docName}</p>
                    )}

                    {/* Animated Progress Bar */}
                    {isProcessing && (
                        <div className="mt-3">
                            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-full"
                                    initial={{ x: '-100%' }}
                                    animate={{ x: '100%' }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 1.5,
                                        ease: 'linear',
                                    }}
                                    style={{ width: '50%' }}
                                />
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-white/50">
                                    {!status || status === 'PENDING' ? 'Starting...' : 'Processing audio...'}
                                </span>
                                <span className="text-xs text-white/50">
                                    {formatTime(elapsedSec)}
                                </span>
                            </div>
                        </div>
                    )}

                    {isReady && (
                        <p className="text-sm text-green-400 mt-1">
                            Opening audio player...
                        </p>
                    )}

                    {isError && (
                        <p className="text-sm text-red-400 mt-1">
                            {data?.error || 'Something went wrong. Please try again.'}
                        </p>
                    )}
                </div>
            </div>

            {/* Fallback UI if onReady isn't provided */}
            {isReady && !onReady && (
                <div className="mt-4 pt-4 border-t border-white/10">
                    <button
                        onClick={refreshDownload}
                        className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-colors"
                    >
                        Get download link
                    </button>
                    {downUrl && (
                        <div className="mt-3">
                            <a
                                className="text-amber-400 hover:underline text-sm"
                                href={downUrl}
                                target="_blank"
                                rel="noreferrer"
                            >
                                Open audio
                            </a>
                            <audio controls src={downUrl} className="w-full mt-2 rounded-lg" />
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
}
