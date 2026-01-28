'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/dashboard/Sidebar';
import LightPillarsBackground from '@/components/reactbits/LightPillarsBackground';
import {
    Flame,
    Target,
    TrendingUp,
    Clock,
    AlertTriangle,
    BookOpen,
    CheckCircle2,
    XCircle,
    ChevronRight,
    Calendar,
    Zap,
    Award,
    BarChart3,
} from 'lucide-react';
import {
    EducationAttemptEvent,
    EducationProgressSummary,
    EducationWeakTopic,
    getEducationAttempts,
    getEducationProgressSummary,
    getEducationWeakTopics,
} from '@/lib/educationApi';

/**
 * Format a percentage value for display.
 */
function fmtPercent(p?: number | null): string {
    if (p === null || p === undefined) return '—';
    const v = p <= 1 ? p * 100 : p;
    return `${Math.round(v)}%`;
}

/**
 * Format a date for display.
 */
function fmtDate(dateStr?: string | null): string {
    if (!dateStr) return '—';
    try {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
        return dateStr;
    }
}

/**
 * Get color class based on accuracy percentage.
 */
function getAccuracyColor(percent?: number | null): string {
    if (percent === null || percent === undefined) return 'text-white/50';
    const v = percent <= 1 ? percent * 100 : percent;
    if (v >= 80) return 'text-green-400';
    if (v >= 60) return 'text-yellow-400';
    return 'text-red-400';
}

/**
 * Get icon for attempt type.
 */
function getAttemptIcon(type?: string | null) {
    switch (type?.toUpperCase()) {
        case 'QUIZ': return <BookOpen className="h-4 w-4" />;
        case 'FLASHCARDS': return <Zap className="h-4 w-4" />;
        default: return <CheckCircle2 className="h-4 w-4" />;
    }
}

/**
 * Stat card component with icon and animation.
 */
type StatCardProps = {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    subtext?: string;
    gradient: string;
    iconBg: string;
    delay: number;
};

function StatCard({ icon, label, value, subtext, gradient, iconBg, delay }: StatCardProps) {
    return (
        <div
            className={`relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/10 p-5 animate-fade-in`}
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className={`absolute inset-0 ${gradient} opacity-50`} />
            <div className="relative z-10">
                <div className="flex items-center justify-between">
                    <div className={`p-2.5 rounded-xl ${iconBg}`}>
                        {icon}
                    </div>
                </div>
                <div className="mt-4">
                    <div className="text-3xl font-bold text-white">{value}</div>
                    <div className="text-sm text-white/60 mt-1">{label}</div>
                    {subtext && <div className="text-xs text-white/40 mt-0.5">{subtext}</div>}
                </div>
            </div>
        </div>
    );
}

export default function EducationProgressPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [summary, setSummary] = useState<EducationProgressSummary | null>(null);
    const [attempts, setAttempts] = useState<EducationAttemptEvent[]>([]);
    const [weakTopics, setWeakTopics] = useState<EducationWeakTopic[]>([]);

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

        return () => { mounted = false; };
    }, [days]);

    const lastStudy = useMemo(() => fmtDate(summary?.lastStudyAt), [summary?.lastStudyAt]);

    // Calculate max count for weak topics progress bars
    const maxWeakCount = useMemo(() => {
        if (weakTopics.length === 0) return 1;
        return Math.max(...weakTopics.map(t => t.count));
    }, [weakTopics]);

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

                    <div className="px-4 md:px-6 py-10 max-w-6xl mx-auto">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 animate-fade-in">
                            <div>
                                <div className="flex items-center gap-2 text-green-400 mb-2">
                                    <BarChart3 className="h-4 w-4" />
                                    <span className="text-sm font-medium">Analytics</span>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
                                    Your Progress
                                </h1>
                                <p className="text-white/60 mt-2 max-w-lg">
                                    Track your learning journey, identify weak areas, and celebrate your achievements.
                                </p>
                            </div>

                            {/* Time period selector */}
                            <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1 border border-white/10">
                                {[7, 14, 30, 90].map((d) => (
                                    <button
                                        key={d}
                                        onClick={() => setDays(d)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                            days === d
                                                ? 'bg-white/10 text-white'
                                                : 'text-white/50 hover:text-white/80'
                                        }`}
                                    >
                                        {d}d
                                    </button>
                                ))}
                            </div>
                        </div>

                        {loading ? (
                            <div className="mt-12 flex flex-col items-center justify-center gap-4">
                                <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
                                <div className="text-white/50">Loading your progress...</div>
                            </div>
                        ) : error ? (
                            <div className="mt-12 p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-center">
                                <XCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
                                <div className="text-red-300">{error}</div>
                            </div>
                        ) : (
                            <>
                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                                    <StatCard
                                        icon={<Flame className="h-5 w-5 text-orange-400" />}
                                        label="Day Streak"
                                        value={summary?.streakDays ?? 0}
                                        subtext={summary?.streakDays && summary.streakDays > 0 ? "Keep it going!" : "Start today!"}
                                        gradient="bg-gradient-to-br from-orange-600/20 to-transparent"
                                        iconBg="bg-orange-500/20"
                                        delay={0}
                                    />
                                    <StatCard
                                        icon={<Target className="h-5 w-5 text-green-400" />}
                                        label="Avg Accuracy"
                                        value={fmtPercent(summary?.avgAccuracy)}
                                        subtext={`Last ${days} days`}
                                        gradient="bg-gradient-to-br from-green-600/20 to-transparent"
                                        iconBg="bg-green-500/20"
                                        delay={50}
                                    />
                                    <StatCard
                                        icon={<TrendingUp className="h-5 w-5 text-blue-400" />}
                                        label="Activities"
                                        value={summary?.attemptsLast30 ?? 0}
                                        subtext="Last 30 days"
                                        gradient="bg-gradient-to-br from-blue-600/20 to-transparent"
                                        iconBg="bg-blue-500/20"
                                        delay={100}
                                    />
                                    <StatCard
                                        icon={<Clock className="h-5 w-5 text-purple-400" />}
                                        label="Last Activity"
                                        value={lastStudy}
                                        gradient="bg-gradient-to-br from-purple-600/20 to-transparent"
                                        iconBg="bg-purple-500/20"
                                        delay={150}
                                    />
                                </div>

                                {/* Two Column Layout */}
                                <div className="grid md:grid-cols-2 gap-6 mt-8">
                                    {/* Weak Topics */}
                                    <div
                                        className="rounded-2xl bg-white/[0.03] border border-white/10 p-6 animate-fade-in"
                                        style={{ animationDelay: '200ms' }}
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 rounded-xl bg-amber-500/20">
                                                <AlertTriangle className="h-5 w-5 text-amber-400" />
                                            </div>
                                            <div>
                                                <h2 className="font-semibold text-white">Areas to Improve</h2>
                                                <p className="text-xs text-white/50">Topics you struggled with</p>
                                            </div>
                                        </div>

                                        {weakTopics.length === 0 ? (
                                            <div className="py-8 text-center">
                                                <Award className="h-12 w-12 text-green-400/50 mx-auto mb-3" />
                                                <div className="text-white/60">No weak topics detected!</div>
                                                <div className="text-sm text-white/40 mt-1">
                                                    Complete more quizzes to get insights
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {weakTopics.map((topic, i) => (
                                                    <div key={topic.topic} className="group">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-sm text-white/80 truncate max-w-[200px]">
                                                                {topic.topic}
                                                            </span>
                                                            <span className="text-xs text-white/50">
                                                                {topic.count} miss{topic.count > 1 ? 'es' : ''}
                                                            </span>
                                                        </div>
                                                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                                                                style={{
                                                                    width: `${(topic.count / maxWeakCount) * 100}%`,
                                                                    animationDelay: `${300 + i * 50}ms`,
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {weakTopics.length > 0 && (
                                            <Link
                                                href="/education/library"
                                                className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm hover:bg-amber-500/20 transition-colors"
                                            >
                                                Practice these topics
                                                <ChevronRight className="h-4 w-4" />
                                            </Link>
                                        )}
                                    </div>

                                    {/* Quick Actions */}
                                    <div
                                        className="rounded-2xl bg-white/[0.03] border border-white/10 p-6 animate-fade-in"
                                        style={{ animationDelay: '250ms' }}
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 rounded-xl bg-purple-500/20">
                                                <Zap className="h-5 w-5 text-purple-400" />
                                            </div>
                                            <div>
                                                <h2 className="font-semibold text-white">Keep Learning</h2>
                                                <p className="text-xs text-white/50">Recommended actions</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Link
                                                href="/education/library"
                                                className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-600/10 to-cyan-600/10 border border-blue-500/20 hover:border-blue-500/40 transition-all group"
                                            >
                                                <div className="p-2 rounded-lg bg-blue-500/20">
                                                    <BookOpen className="h-4 w-4 text-blue-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-sm font-medium text-white">Take a Quiz</div>
                                                    <div className="text-xs text-white/50">Test your knowledge</div>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-white/30 group-hover:text-white/60 transition-colors" />
                                            </Link>

                                            <Link
                                                href="/education/library"
                                                className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-green-600/10 to-emerald-600/10 border border-green-500/20 hover:border-green-500/40 transition-all group"
                                            >
                                                <div className="p-2 rounded-lg bg-green-500/20">
                                                    <Zap className="h-4 w-4 text-green-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-sm font-medium text-white">Study Flashcards</div>
                                                    <div className="text-xs text-white/50">Quick review session</div>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-white/30 group-hover:text-white/60 transition-colors" />
                                            </Link>

                                            <Link
                                                href="/education/calendar"
                                                className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-purple-500/20 hover:border-purple-500/40 transition-all group"
                                            >
                                                <div className="p-2 rounded-lg bg-purple-500/20">
                                                    <Calendar className="h-4 w-4 text-purple-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-sm font-medium text-white">Study Calendar</div>
                                                    <div className="text-xs text-white/50">Plan your schedule</div>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-white/30 group-hover:text-white/60 transition-colors" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Activity */}
                                <div
                                    className="mt-8 rounded-2xl bg-white/[0.03] border border-white/10 p-6 animate-fade-in"
                                    style={{ animationDelay: '300ms' }}
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-xl bg-blue-500/20">
                                                <TrendingUp className="h-5 w-5 text-blue-400" />
                                            </div>
                                            <div>
                                                <h2 className="font-semibold text-white">Recent Activity</h2>
                                                <p className="text-xs text-white/50">Your latest study sessions</p>
                                            </div>
                                        </div>
                                        <div className="text-sm text-white/40">
                                            {attempts.length} session{attempts.length !== 1 ? 's' : ''}
                                        </div>
                                    </div>

                                    {attempts.length === 0 ? (
                                        <div className="py-12 text-center">
                                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                                                <BookOpen className="h-8 w-8 text-white/20" />
                                            </div>
                                            <div className="text-white/60 mb-2">No activity yet</div>
                                            <div className="text-sm text-white/40 mb-4">
                                                Complete a quiz or flashcard session to track progress
                                            </div>
                                            <Link
                                                href="/education/library"
                                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors"
                                            >
                                                Start Learning
                                                <ChevronRight className="h-4 w-4" />
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {attempts.slice(0, 10).map((attempt, i) => (
                                                <div
                                                    key={attempt.id}
                                                    className="flex items-center gap-4 p-4 rounded-xl bg-black/20 border border-white/5 hover:border-white/10 transition-all"
                                                    style={{ animationDelay: `${350 + i * 30}ms` }}
                                                >
                                                    {/* Icon */}
                                                    <div className={`p-2.5 rounded-xl ${
                                                        attempt.attemptType?.toUpperCase() === 'QUIZ'
                                                            ? 'bg-blue-500/20 text-blue-400'
                                                            : 'bg-green-500/20 text-green-400'
                                                    }`}>
                                                        {getAttemptIcon(attempt.attemptType)}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-white">
                                                                {attempt.attemptType ?? 'Activity'}
                                                            </span>
                                                            {attempt.mode && (
                                                                <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs text-white/60">
                                                                    {attempt.mode}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-white/40 mt-0.5">
                                                            Document #{attempt.docId} · {fmtDate(attempt.createdAt)}
                                                        </div>
                                                    </div>

                                                    {/* Score */}
                                                    <div className="text-right">
                                                        <div className={`text-lg font-bold ${getAccuracyColor(attempt.percent)}`}>
                                                            {fmtPercent(attempt.percent)}
                                                        </div>
                                                        {attempt.score != null && attempt.maxScore != null && (
                                                            <div className="text-xs text-white/40">
                                                                {attempt.score}/{attempt.maxScore}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}

                                            {attempts.length > 10 && (
                                                <div className="text-center pt-4">
                                                    <span className="text-sm text-white/40">
                                                        + {attempts.length - 10} more sessions
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </main>

            {/* Animations */}
            <style jsx>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out forwards;
                    opacity: 0;
                }
            `}</style>
        </div>
    );
}
