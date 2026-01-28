'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    StudyPlan,
    StudyTask,
    createStudyPlan,
    getStudyPlans,
    deleteStudyPlan,
    completeStudyTask,
    skipStudyTask
} from '@/lib/educationApi';
import Sidebar from '@/components/dashboard/Sidebar';
import LightPillarsBackground from '@/components/reactbits/LightPillarsBackground';

type ViewMode = 'list' | 'create' | 'view';

/**
 * Task type icons and colors.
 */
const TASK_TYPES: Record<string, { icon: string; color: string; label: string }> = {
    reading: { icon: '📖', color: 'bg-blue-500/20 border-blue-500/30', label: 'Reading' },
    flashcards: { icon: '🃏', color: 'bg-purple-500/20 border-purple-500/30', label: 'Flashcards' },
    quiz: { icon: '📝', color: 'bg-green-500/20 border-green-500/30', label: 'Quiz' },
    review: { icon: '🔄', color: 'bg-orange-500/20 border-orange-500/30', label: 'Review' },
    notes: { icon: '📋', color: 'bg-teal-500/20 border-teal-500/30', label: 'Notes' },
};

export default function StudyCalendarPage() {
    const router = useRouter();

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) router.replace('/login');
    }, [router]);

    const [plans, setPlans] = useState<StudyPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [currentPlan, setCurrentPlan] = useState<StudyPlan | null>(null);

    // Create form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [examDate, setExamDate] = useState('');
    const [weeklyHours, setWeeklyHours] = useState(10);

    // Load plans on mount
    useEffect(() => {
        loadPlans();
    }, []);

    async function loadPlans() {
        setLoading(true);
        setError(null);
        try {
            const data = await getStudyPlans();
            setPlans(data);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to load study plans');
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate() {
        if (!title.trim()) {
            setError('Plan title is required');
            return;
        }
        if (!examDate) {
            setError('Exam date is required');
            return;
        }

        setCreating(true);
        setError(null);

        try {
            const plan = await createStudyPlan({
                title,
                description: description || undefined,
                examDate,
                weeklyHours
            });
            setPlans(prev => [plan, ...prev]);
            setCurrentPlan(plan);
            setViewMode('view');
            // Reset form
            setTitle('');
            setDescription('');
            setExamDate('');
            setWeeklyHours(10);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to create study plan');
        } finally {
            setCreating(false);
        }
    }

    async function handleDelete(planId: number) {
        if (!confirm('Are you sure you want to delete this study plan?')) return;
        try {
            await deleteStudyPlan(planId);
            setPlans(prev => prev.filter(p => p.id !== planId));
            if (currentPlan?.id === planId) {
                setCurrentPlan(null);
                setViewMode('list');
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to delete plan');
        }
    }

    async function handleCompleteTask(taskId: number) {
        try {
            const updated = await completeStudyTask(taskId);
            updateTaskInPlan(updated);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to complete task');
        }
    }

    async function handleSkipTask(taskId: number) {
        try {
            const updated = await skipStudyTask(taskId);
            updateTaskInPlan(updated);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to skip task');
        }
    }

    function updateTaskInPlan(updatedTask: StudyTask) {
        if (!currentPlan) return;
        const updatedTasks = currentPlan.tasks.map(t =>
            t.id === updatedTask.id ? updatedTask : t
        );
        const completedCount = updatedTasks.filter(t => t.status === 'completed').length;
        setCurrentPlan({
            ...currentPlan,
            tasks: updatedTasks,
            completedTasks: completedCount
        });
    }

    function viewPlan(plan: StudyPlan) {
        setCurrentPlan(plan);
        setViewMode('view');
    }

    function getTaskTypeInfo(type: string) {
        return TASK_TYPES[type] || { icon: '📌', color: 'bg-gray-500/20 border-gray-500/30', label: type };
    }

    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    }

    function getDaysUntilExam(examDate: string) {
        const today = new Date();
        const exam = new Date(examDate);
        const diff = Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    }

    // Page wrapper
    const PageWrapper = ({ children }: { children: React.ReactNode }) => (
        <div className="min-h-screen bg-black text-white">
            <Sidebar />
            <main className="md:ml-56">
                <div className="relative overflow-hidden min-h-screen">
                    <div className="pointer-events-none absolute inset-0 -z-10">
                        <LightPillarsBackground />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/45" />
                        <div className="absolute inset-0 bg-vignette-strong opacity-100" />
                    </div>
                    {children}
                </div>
            </main>
        </div>
    );

    // Create form view
    if (viewMode === 'create') {
        return (
            <PageWrapper>
                <div className="max-w-2xl mx-auto p-6">
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                        <h1 className="text-2xl font-bold text-white mb-6">Create Study Plan</h1>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-white/70 text-sm mb-2">Plan Title *</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., Final Exam Prep"
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-white/70 text-sm mb-2">Description (optional)</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="What are you studying for?"
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 transition resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-white/70 text-sm mb-2">Exam/Goal Date *</label>
                                <input
                                    type="date"
                                    value={examDate}
                                    onChange={(e) => setExamDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-white/70 text-sm mb-2">Hours per Week: {weeklyHours}</label>
                                <input
                                    type="range"
                                    min="2"
                                    max="40"
                                    value={weeklyHours}
                                    onChange={(e) => setWeeklyHours(parseInt(e.target.value))}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-white/40 text-xs mt-1">
                                    <span>2 hrs</span>
                                    <span>40 hrs</span>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-300 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={handleCreate}
                                disabled={creating}
                                className="px-6 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                {creating ? 'Creating...' : 'Create Plan'}
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className="px-6 py-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </PageWrapper>
        );
    }

    // Plan detail view
    if (viewMode === 'view' && currentPlan) {
        const daysLeft = getDaysUntilExam(currentPlan.examDate);
        const progress = currentPlan.totalTasks > 0
            ? Math.round((currentPlan.completedTasks / currentPlan.totalTasks) * 100)
            : 0;

        // Group tasks by date
        const tasksByDate = currentPlan.tasks.reduce((acc, task) => {
            const date = task.scheduledDate;
            if (!acc[date]) acc[date] = [];
            acc[date].push(task);
            return acc;
        }, {} as Record<string, StudyTask[]>);

        return (
            <PageWrapper>
                <div className="max-w-4xl mx-auto p-6">
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-white">{currentPlan.title}</h1>
                                {currentPlan.description && (
                                    <p className="text-white/60 mt-1">{currentPlan.description}</p>
                                )}
                            </div>
                            <button
                                onClick={() => handleDelete(currentPlan.id)}
                                className="px-3 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition"
                            >
                                Delete Plan
                            </button>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-white/5 rounded-xl p-4 text-center">
                                <div className="text-3xl font-bold text-purple-400">{daysLeft}</div>
                                <div className="text-white/50 text-sm">Days Until Exam</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 text-center">
                                <div className="text-3xl font-bold text-green-400">{progress}%</div>
                                <div className="text-white/50 text-sm">Complete</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 text-center">
                                <div className="text-3xl font-bold text-blue-400">
                                    {currentPlan.completedTasks}/{currentPlan.totalTasks}
                                </div>
                                <div className="text-white/50 text-sm">Tasks Done</div>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full bg-white/10 rounded-full h-3 mb-6">
                            <div
                                className="bg-gradient-to-r from-purple-600 to-blue-500 h-3 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        {/* Tasks by date */}
                        <div className="space-y-6">
                            {Object.entries(tasksByDate).map(([date, tasks]) => (
                                <div key={date}>
                                    <h3 className="text-white/70 text-sm font-medium mb-3">
                                        {formatDate(date)}
                                    </h3>
                                    <div className="space-y-2">
                                        {tasks.map(task => {
                                            const typeInfo = getTaskTypeInfo(task.taskType);
                                            const isCompleted = task.status === 'completed';
                                            const isSkipped = task.status === 'skipped';
                                            const isPast = new Date(task.scheduledDate) < new Date(new Date().toDateString());

                                            return (
                                                <div
                                                    key={task.id}
                                                    className={`p-4 rounded-xl border transition ${
                                                        isCompleted
                                                            ? 'bg-green-500/10 border-green-500/20'
                                                            : isSkipped
                                                            ? 'bg-gray-500/10 border-gray-500/20 opacity-50'
                                                            : typeInfo.color
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-2xl">{typeInfo.icon}</span>
                                                            <div>
                                                                <div className={`font-medium ${isCompleted ? 'text-green-400 line-through' : isSkipped ? 'text-gray-400 line-through' : 'text-white'}`}>
                                                                    {task.title}
                                                                </div>
                                                                <div className="text-white/50 text-sm">
                                                                    {typeInfo.label} • {task.durationMins} min
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {task.status === 'pending' && (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleCompleteTask(task.id)}
                                                                    className="px-3 py-1 rounded-lg bg-green-500/20 text-green-400 text-sm hover:bg-green-500/30 transition"
                                                                >
                                                                    Complete
                                                                </button>
                                                                <button
                                                                    onClick={() => handleSkipTask(task.id)}
                                                                    className="px-3 py-1 rounded-lg bg-gray-500/20 text-gray-400 text-sm hover:bg-gray-500/30 transition"
                                                                >
                                                                    Skip
                                                                </button>
                                                            </div>
                                                        )}
                                                        {isCompleted && (
                                                            <span className="text-green-400">✓</span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={() => {
                                    setViewMode('list');
                                    setCurrentPlan(null);
                                }}
                                className="px-6 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-500 transition"
                            >
                                Back to Plans
                            </button>
                        </div>
                    </div>
                </div>
            </PageWrapper>
        );
    }

    // List view
    return (
        <PageWrapper>
            <div className="max-w-4xl mx-auto p-6">
                <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-white">Study Calendar</h1>
                            <p className="text-white/60 mt-1">Create and track your study plans</p>
                        </div>
                        <button
                            onClick={() => setViewMode('create')}
                            className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-500 transition"
                        >
                            + New Plan
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="text-white/50 text-center py-8">Loading study plans...</div>
                    ) : plans.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-white/30 text-4xl mb-4">📅</div>
                            <p className="text-white/70 mb-4">No study plans yet</p>
                            <p className="text-white/50 text-sm mb-6">
                                Create a study plan to organize your learning and track progress toward your goals.
                            </p>
                            <button
                                onClick={() => setViewMode('create')}
                                className="px-6 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-500 transition"
                            >
                                Create Your First Plan
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {plans.map(plan => {
                                const daysLeft = getDaysUntilExam(plan.examDate);
                                const progress = plan.totalTasks > 0
                                    ? Math.round((plan.completedTasks / plan.totalTasks) * 100)
                                    : 0;

                                return (
                                    <div
                                        key={plan.id}
                                        className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition cursor-pointer"
                                        onClick={() => viewPlan(plan)}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-white font-medium">{plan.title}</h3>
                                            <span className={`text-sm ${daysLeft <= 7 ? 'text-red-400' : 'text-white/50'}`}>
                                                {daysLeft} days left
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-white/50">
                                            <span>{plan.completedTasks}/{plan.totalTasks} tasks</span>
                                            <span>•</span>
                                            <span>Exam: {formatDate(plan.examDate)}</span>
                                        </div>
                                        <div className="w-full bg-white/10 rounded-full h-2 mt-3">
                                            <div
                                                className="bg-purple-600 h-2 rounded-full transition-all"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </PageWrapper>
    );
}
