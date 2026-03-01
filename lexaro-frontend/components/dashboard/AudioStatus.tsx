'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import api from '@/lib/api';
import { useAudioStatus } from '@/hooks/useAudioStatus';

// Re-export AudioStatusResponse from lib/documents so existing consumers that import
// this type from AudioStatus.tsx are not broken.
export type { AudioStatusResponse } from '@/lib/documents';

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
    // React Query drives all polling — no manual setTimeout needed.
    const { data } = useAudioStatus(docId);

    const [downUrl, setDownUrl] = useState<string>('');
    const [elapsedSec, setElapsedSec] = useState(0);

    // Guard so onReady fires at most once per docId mount.
    const navigatedRef = useRef(false);

    // Reset elapsed timer and navigation guard whenever the docId changes.
    const startTimeRef = useRef<number>(Date.now());
    useEffect(() => {
        startTimeRef.current = Date.now();
        setElapsedSec(0);
        setDownUrl('');
        navigatedRef.current = false;
    }, [docId]);

    // Elapsed time counter — ticks every second while the component is mounted.
    useEffect(() => {
        const interval = setInterval(() => {
            setElapsedSec(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [docId]);

    // Fire onReady exactly once when the status transitions to READY.
    useEffect(() => {
        if (data?.status === 'READY' && !navigatedRef.current) {
            navigatedRef.current = true;
            onReady?.(docId);
        }
    }, [data?.status, docId, onReady]);

    async function refreshDownload() {
        const { data: presign } = await api.get<PresignDownloadResponse>(
            `/documents/${docId}/audio/download`,
            { params: { ttlSeconds: 300 } },
        );
        setDownUrl(presign.url);
    }

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return m > 0 ? `${m}m ${s}s` : `${s}s`;
    };

    const status = data?.status;
    // NONE = no audio job started yet; PROCESSING = job running; undefined = initial load
    const isProcessing = !status || status === 'NONE' || status === 'PROCESSING';
    const isReady = status === 'READY';
    // FAILED = backend failure; NOT_FOUND = synthetic 404 sentinel
    const isError = status === 'FAILED' || status === 'NOT_FOUND';

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
                                    {!status || status === 'NONE' ? 'Starting...' : 'Processing audio...'}
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
