'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import LightPillarsBackground from '@/components/reactbits/LightPillarsBackground';
import {
    EducationAttemptEvent,
    EducationProgressSummary,
    EducationWeakTopic,
    getEducationAttempts,
    getEducationProgressSummary,
    getEducationWeakTopics,
} from '@/lib/educationApi';

function fmtPercent(p?: number | null) {
    if (p === null || p === undefined) return '—';
    const v = p <= 1 ? p * 100 : p; // supports either 0-1 or 0-100
    return `${v.toFixed(1)}%`;
}

export default function EducationProgressPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [summary, setSummary] = useState<EducationProgressSummary | null>(null);
    const [attempts, setAttempts] = useState<EducationAttemptEvent[]>([]);
    const [weakTopics, setWeakTopics] = useState<EducationWeakTopic[]>([]);

    // controls
    const [days, setDays] = useState(30);

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) router.replace('/login');
    }, [router]);

    useEffect(() => {
        let mounted = true;

        (async () => {
            setLoading(true);
            setError('');
            try {
                const [s, a, w] = await Promise.all([
                    getEducationProgressSummary(),
                    getEducationAttempts(days, 50),
                    getEducationWeakTopics(days, 10),
                ]);
                if (!mounted) return;
                setSummary(s);
                setAttempts(a ?? []);
                setWeakTopics(w ?? []);
            } catch (e: any) {
                if (!mounted) return;
                setError(e?.response?.data?.message || 'Failed to load progress.');
            } finally {
                if (mounted) setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [days]);

    const lastStudy = useMemo(() => {
        if (!summary?.lastStudyAt) return '—';
        try {
            return new Date(summary.lastStudyAt).toLocaleString();
        } catch {
            return summary.lastStudyAt;
        }
    }, [summary?.lastStudyAt]);

    return (
        <div className="min-h-screen bg-black text-white">
            <Sidebar />
            <main className="md:ml-56">
                <div className="relative overflow-hidden min-h-screen">
                    <div className="pointer-events-none absolute inset-0 -z-10">
                        <LightPillarsBackground />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/45" />
                        <div className="absolute inset-0 bg-vignette-strong opacity-100" />
                    </div>

                    <div className="px-4 md:px-6 py-10 max-w-6xl mx-auto">
                        <div className="flex items-start justify-between gap-6">
                            <div>
                                <h1 className="text-3xl font-semibold">Progress</h1>
                                <p className="text-white/70 mt-2">
                                    Streaks, accuracy, and weak topics (MVP).
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-sm text-white/60">Window</span>
                                <select
                                    value={days}
                                    onChange={(e) => setDays(Number(e.target.value))}
                                    className="px-3 py-2 rounded-xl bg-white/10 border border-white/15 outline-none"
                                >
                                    <option value={7}>7 days</option>
                                    <option value={14}>14 days</option>
                                    <option value={30}>30 days</option>
                                    <option value={90}>90 days</option>
                                </select>
                            </div>
                        </div>

                        {loading ? (
                            <div className="mt-8 text-white/70">Loading…</div>
                        ) : error ? (
                            <div className="mt-8 text-sm text-red-300">{error}</div>
                        ) : (
                            <>
                                {/* Summary cards */}
                                <div className="grid md:grid-cols-4 gap-4 mt-8">
                                    <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                                        <div className="text-sm text-white/60">Streak</div>
                                        <div className="mt-2 text-2xl font-semibold">{summary?.streakDays ?? 0}</div>
                                        <div className="text-xs text-white/50 mt-1">days</div>
                                    </div>

                                    <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                                        <div className="text-sm text-white/60">Avg Accuracy</div>
                                        <div className="mt-2 text-2xl font-semibold">
                                            {fmtPercent(summary?.avgAccuracy)}
                                        </div>
                                        <div className="text-xs text-white/50 mt-1">last {days} days</div>
                                    </div>

                                    <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                                        <div className="text-sm text-white/60">Attempts</div>
                                        <div className="mt-2 text-2xl font-semibold">{summary?.attemptsLast30 ?? 0}</div>
                                        <div className="text-xs text-white/50 mt-1">last 30 days</div>
                                    </div>

                                    <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                                        <div className="text-sm text-white/60">Last Study</div>
                                        <div className="mt-2 text-sm text-white/85">{lastStudy}</div>
                                    </div>
                                </div>

                                {/* Weak topics */}
                                <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 p-5">
                                    <div className="font-semibold">Weak Topics</div>
                                    <div className="text-sm text-white/60 mt-1">
                                        Based on attempts in the selected window.
                                    </div>

                                    {weakTopics.length === 0 ? (
                                        <div className="mt-4 text-sm text-white/60">No weak topics yet.</div>
                                    ) : (
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {weakTopics.map((t) => (
                                                <div
                                                    key={t.topic}
                                                    className="px-3 py-1.5 rounded-full bg-black/35 border border-white/10 text-sm"
                                                >
                                                    <span className="text-white/85">{t.topic}</span>
                                                    <span className="text-white/40"> · {t.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Attempts */}
                                <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 p-5">
                                    <div className="font-semibold">Recent Attempts</div>
                                    <div className="text-sm text-white/60 mt-1">
                                        Most recent events (limit 50).
                                    </div>

                                    {attempts.length === 0 ? (
                                        <div className="mt-4 text-sm text-white/60">No attempts yet.</div>
                                    ) : (
                                        <div className="mt-4 space-y-3">
                                            {attempts.map((a) => (
                                                <div key={a.id} className="rounded-xl bg-black/30 border border-white/10 p-4">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="text-xs text-white/60">
                                                            Doc #{a.docId} · {a.attemptType ?? '—'} · {a.mode ?? '—'}
                                                        </div>
                                                        <div className="text-xs text-white/60">
                                                            {a.createdAt ? new Date(a.createdAt).toLocaleString() : '—'}
                                                        </div>
                                                    </div>

                                                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                                                        <div className="text-white/85">
                                                            Score: <span className="text-white">{a.score ?? '—'}</span>
                                                            {a.maxScore != null ? <span className="text-white/60"> / {a.maxScore}</span> : null}
                                                        </div>
                                                        <div className="text-white/85">
                                                            Accuracy: <span className="text-white">{fmtPercent(a.percent)}</span>
                                                        </div>
                                                    </div>

                                                    {a.weakTopics && a.weakTopics.length > 0 && (
                                                        <div className="mt-3 flex flex-wrap gap-2">
                                                            {a.weakTopics.map((t) => (
                                                                <span
                                                                    key={t}
                                                                    className="text-xs px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/75"
                                                                >
                                  {t}
                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
