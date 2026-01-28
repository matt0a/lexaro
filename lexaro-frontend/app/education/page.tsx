'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import LightPillarsBackground from '@/components/reactbits/LightPillarsBackground';
import {
    BookOpen,
    MessageSquare,
    FileText,
    Layers,
    PenTool,
    Calendar,
    TrendingUp,
    Flame,
    Target,
    Clock,
    ChevronRight,
    Plus,
    Sparkles,
} from 'lucide-react';
import {
    getEducationProgressSummary,
    getStudyPlans,
    getOnboardingStatus,
    type EducationProgressSummary,
    type StudyPlan,
} from '@/lib/educationApi';
import { getEducationDocuments, type EducationDocument } from '@/lib/documents';
import OnboardingWizard from '@/components/education/OnboardingWizard';

/**
 * Feature card for quick access to education tools.
 */
type FeatureCardProps = {
    href: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    gradient: string;
    delay: number;
};

function FeatureCard({ href, icon, title, description, gradient, delay }: FeatureCardProps) {
    return (
        <Link
            href={href}
            className="group relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/10 p-5 hover:border-white/20 hover:bg-white/[0.06] transition-all duration-300"
            style={{ animationDelay: `${delay}ms` }}
        >
            {/* Gradient glow on hover */}
            <div
                className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${gradient}`}
            />

            <div className="relative z-10">
                <div className="flex items-center justify-between">
                    <div className={`p-2.5 rounded-xl ${gradient} bg-opacity-20`}>
                        {icon}
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/40 group-hover:text-white/70 group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="mt-4 font-semibold text-white">{title}</h3>
                <p className="mt-1 text-sm text-white/60">{description}</p>
            </div>
        </Link>
    );
}

/**
 * Stat card for displaying progress metrics.
 */
type StatCardProps = {
    icon: React.ReactNode;
    value: string | number;
    label: string;
    color: string;
};

function StatCard({ icon, value, label, color }: StatCardProps) {
    return (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10">
            <div className={`p-2 rounded-lg ${color}`}>
                {icon}
            </div>
            <div>
                <div className="text-xl font-bold text-white">{value}</div>
                <div className="text-xs text-white/50">{label}</div>
            </div>
        </div>
    );
}

export default function EducationHomePage() {
    const router = useRouter();
    const [stats, setStats] = useState<EducationProgressSummary | null>(null);
    const [plans, setPlans] = useState<StudyPlan[]>([]);
    const [recentDocs, setRecentDocs] = useState<EducationDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) {
            router.replace('/login');
            return;
        }

        // Fetch all dashboard data in parallel
        Promise.all([
            getEducationProgressSummary().catch(() => null),
            getStudyPlans().catch(() => []),
            getEducationDocuments().catch(() => []),
            getOnboardingStatus().catch(() => ({ completed: true })), // Default to completed if error
        ]).then(([progressData, plansData, docsData, onboardingData]) => {
            setStats(progressData);
            setPlans(plansData);
            setRecentDocs(docsData.slice(0, 3)); // Show only 3 recent docs
            setLoading(false);

            // Show onboarding wizard if not completed
            if (!onboardingData.completed) {
                setShowOnboarding(true);
            }
        });
    }, [router]);

    // Get active study plan (if any)
    const activePlan = plans.find(p => p.status === 'active');
    const planProgress = activePlan
        ? Math.round((activePlan.completedTasks / activePlan.totalTasks) * 100)
        : 0;

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
                        {/* Header with welcome message */}
                        <div className="animate-fade-in">
                            <div className="flex items-center gap-2 text-purple-400 mb-2">
                                <Sparkles className="h-4 w-4" />
                                <span className="text-sm font-medium">Lexaro Learn</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
                                Education Hub
                            </h1>
                            <p className="text-white/60 mt-2 max-w-xl">
                                Your AI-powered study companion. Upload documents, generate study materials, and track your progress.
                            </p>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
                            <StatCard
                                icon={<Flame className="h-5 w-5 text-orange-400" />}
                                value={stats?.streakDays ?? 0}
                                label="Day Streak"
                                color="bg-orange-500/20"
                            />
                            <StatCard
                                icon={<Target className="h-5 w-5 text-green-400" />}
                                value={stats?.avgAccuracy ? `${Math.round(stats.avgAccuracy)}%` : '—'}
                                label="Avg Accuracy"
                                color="bg-green-500/20"
                            />
                            <StatCard
                                icon={<TrendingUp className="h-5 w-5 text-blue-400" />}
                                value={stats?.attemptsLast30 ?? 0}
                                label="Activities (30d)"
                                color="bg-blue-500/20"
                            />
                            <StatCard
                                icon={<BookOpen className="h-5 w-5 text-purple-400" />}
                                value={recentDocs.length}
                                label="Documents"
                                color="bg-purple-500/20"
                            />
                        </div>

                        {/* Active Study Plan Banner */}
                        {activePlan && (
                            <div
                                className="mt-8 p-5 rounded-2xl bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-cyan-600/20 border border-purple-500/30 animate-fade-in"
                                style={{ animationDelay: '150ms' }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-xl bg-purple-500/20">
                                            <Calendar className="h-6 w-6 text-purple-400" />
                                        </div>
                                        <div>
                                            <div className="text-sm text-purple-300">Active Study Plan</div>
                                            <div className="font-semibold text-lg">{activePlan.title}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-white">{planProgress}%</div>
                                            <div className="text-xs text-white/50">{activePlan.completedTasks}/{activePlan.totalTasks} tasks</div>
                                        </div>
                                        <Link
                                            href="/education/calendar"
                                            className="px-4 py-2 rounded-xl bg-purple-500/30 hover:bg-purple-500/40 border border-purple-500/50 transition-colors"
                                        >
                                            View Plan
                                        </Link>
                                    </div>
                                </div>
                                {/* Progress bar */}
                                <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full transition-all duration-500"
                                        style={{ width: `${planProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Feature Cards */}
                        <div className="mt-8">
                            <h2 className="text-lg font-semibold text-white/90 mb-4">Study Tools</h2>
                            <div className="grid md:grid-cols-3 gap-4">
                                <FeatureCard
                                    href="/education/chat"
                                    icon={<MessageSquare className="h-5 w-5 text-blue-400" />}
                                    title="AI Tutor"
                                    description="Chat with AI about your documents with source citations"
                                    gradient="bg-gradient-to-br from-blue-600/10 to-transparent"
                                    delay={200}
                                />
                                <FeatureCard
                                    href="/education/library"
                                    icon={<Layers className="h-5 w-5 text-green-400" />}
                                    title="Flashcards"
                                    description="Generate and study flashcards from your materials"
                                    gradient="bg-gradient-to-br from-green-600/10 to-transparent"
                                    delay={250}
                                />
                                <FeatureCard
                                    href="/education/library"
                                    icon={<FileText className="h-5 w-5 text-amber-400" />}
                                    title="Quizzes"
                                    description="Test your knowledge with AI-generated quizzes"
                                    gradient="bg-gradient-to-br from-amber-600/10 to-transparent"
                                    delay={300}
                                />
                                <FeatureCard
                                    href="/education/library"
                                    icon={<BookOpen className="h-5 w-5 text-purple-400" />}
                                    title="Smart Notes"
                                    description="Generate structured notes in multiple formats"
                                    gradient="bg-gradient-to-br from-purple-600/10 to-transparent"
                                    delay={350}
                                />
                                <FeatureCard
                                    href="/education/essay"
                                    icon={<PenTool className="h-5 w-5 text-pink-400" />}
                                    title="Essay Grader"
                                    description="Get detailed feedback on your essays"
                                    gradient="bg-gradient-to-br from-pink-600/10 to-transparent"
                                    delay={400}
                                />
                                <FeatureCard
                                    href="/education/calendar"
                                    icon={<Calendar className="h-5 w-5 text-cyan-400" />}
                                    title="Study Calendar"
                                    description="Plan and track your study schedule"
                                    gradient="bg-gradient-to-br from-cyan-600/10 to-transparent"
                                    delay={450}
                                />
                            </div>
                        </div>

                        {/* Recent Documents + Quick Actions */}
                        <div className="grid md:grid-cols-2 gap-6 mt-8">
                            {/* Recent Documents */}
                            <div className="animate-fade-in" style={{ animationDelay: '500ms' }}>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold text-white/90">Recent Documents</h2>
                                    <Link href="/education/library" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
                                        View all
                                    </Link>
                                </div>
                                <div className="space-y-2">
                                    {loading ? (
                                        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-white/50 text-center">
                                            Loading...
                                        </div>
                                    ) : recentDocs.length === 0 ? (
                                        <div className="p-6 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                                            <div className="text-white/40 mb-3">No documents yet</div>
                                            <Link
                                                href="/education/library?create=1"
                                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Add your first document
                                            </Link>
                                        </div>
                                    ) : (
                                        recentDocs.map((doc) => (
                                            <Link
                                                key={doc.id}
                                                href={`/education/doc/${doc.id}`}
                                                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition-all group"
                                            >
                                                <div className="p-2 rounded-lg bg-purple-500/20">
                                                    <FileText className="h-4 w-4 text-purple-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-white/90 truncate">{doc.filename}</div>
                                                    <div className="text-xs text-white/40">
                                                        {doc.pages ? `${doc.pages} pages` : 'Processing...'}
                                                    </div>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-white/30 group-hover:text-white/60 transition-colors" />
                                            </Link>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="animate-fade-in" style={{ animationDelay: '550ms' }}>
                                <h2 className="text-lg font-semibold text-white/90 mb-4">Quick Actions</h2>
                                <div className="space-y-3">
                                    <Link
                                        href="/education/library?create=1"
                                        className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 hover:border-purple-500/50 transition-all group"
                                    >
                                        <div className="p-2 rounded-lg bg-purple-500/30">
                                            <Plus className="h-5 w-5 text-purple-300" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium text-white">Upload Document</div>
                                            <div className="text-sm text-white/50">Add PDF, DOCX, or text to study</div>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-white/30 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
                                    </Link>

                                    <Link
                                        href="/education/calendar"
                                        className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-cyan-600/20 to-teal-600/20 border border-cyan-500/30 hover:border-cyan-500/50 transition-all group"
                                    >
                                        <div className="p-2 rounded-lg bg-cyan-500/30">
                                            <Calendar className="h-5 w-5 text-cyan-300" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium text-white">Create Study Plan</div>
                                            <div className="text-sm text-white/50">Schedule your learning goals</div>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-white/30 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
                                    </Link>

                                    <Link
                                        href="/education/progress"
                                        className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 hover:border-green-500/50 transition-all group"
                                    >
                                        <div className="p-2 rounded-lg bg-green-500/30">
                                            <TrendingUp className="h-5 w-5 text-green-300" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium text-white">View Progress</div>
                                            <div className="text-sm text-white/50">Track your learning journey</div>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-white/30 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Tip of the day or motivation */}
                        <div
                            className="mt-8 p-5 rounded-2xl bg-gradient-to-r from-amber-600/10 via-orange-600/10 to-red-600/10 border border-amber-500/20 animate-fade-in"
                            style={{ animationDelay: '600ms' }}
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-2 rounded-lg bg-amber-500/20">
                                    <Sparkles className="h-5 w-5 text-amber-400" />
                                </div>
                                <div>
                                    <div className="font-medium text-amber-300">Study Tip</div>
                                    <p className="text-sm text-white/60 mt-1">
                                        Active recall through quizzes and flashcards is more effective than passive reading.
                                        Try generating a quiz after reading each chapter!
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Add CSS for animations */}
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

            {/* Onboarding Wizard */}
            {showOnboarding && (
                <OnboardingWizard
                    onComplete={() => setShowOnboarding(false)}
                    onDismiss={() => setShowOnboarding(false)}
                />
            )}
        </div>
    );
}
