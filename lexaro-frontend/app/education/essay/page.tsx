'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EssayGradeResponse, gradeEssay } from '@/lib/educationApi';
import Sidebar from '@/components/dashboard/Sidebar';
import LightPillarsBackground from '@/components/reactbits/LightPillarsBackground';

/**
 * Rubric criteria labels for display.
 */
const RUBRIC_LABELS: Record<string, { label: string; description: string }> = {
    thesis: { label: 'Thesis & Argument', description: 'Clear thesis with well-developed argument' },
    organization: { label: 'Organization', description: 'Logical structure with clear flow' },
    evidence: { label: 'Evidence & Support', description: 'Claims backed by examples' },
    analysis: { label: 'Analysis', description: 'Deep critical thinking' },
    clarity: { label: 'Clarity & Style', description: 'Clear and engaging writing' },
    grammar: { label: 'Grammar', description: 'Correct mechanics' },
};

export default function EssayGraderPage() {
    const router = useRouter();

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) router.replace('/login');
    }, [router]);
    const [essay, setEssay] = useState('');
    const [topic, setTopic] = useState('');
    const [grading, setGrading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<EssayGradeResponse | null>(null);

    async function handleGrade() {
        if (!essay.trim()) {
            setError('Please enter your essay text');
            return;
        }

        if (essay.trim().length < 50) {
            setError('Essay is too short. Please provide at least 50 characters.');
            return;
        }

        setGrading(true);
        setError(null);

        try {
            const response = await gradeEssay({ essay, topic: topic || undefined });
            setResult(response);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to grade essay');
        } finally {
            setGrading(false);
        }
    }

    function handleReset() {
        setResult(null);
        setEssay('');
        setTopic('');
        setError(null);
    }

    function getScoreColor(score: number): string {
        if (score >= 8) return 'text-green-400';
        if (score >= 6) return 'text-yellow-400';
        return 'text-red-400';
    }

    function getOverallColor(score: number): string {
        if (score >= 80) return 'text-green-400';
        if (score >= 60) return 'text-yellow-400';
        return 'text-red-400';
    }

    // Wrapper component for consistent layout
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

    // Show results if we have them
    if (result) {
        return (
            <PageWrapper>
            <div className="max-w-4xl mx-auto p-6">
                <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                    <h1 className="text-2xl font-bold text-white mb-6">Essay Grading Results</h1>

                    {/* Overall Score */}
                    <div className="bg-white/5 rounded-xl p-6 mb-6 text-center">
                        <div className="text-white/50 text-sm mb-2">Overall Score</div>
                        <div className={`text-6xl font-bold mb-2 ${getOverallColor(result.overallScore)}`}>
                            {result.overallScore}
                        </div>
                        <div className="text-white/50">out of 100</div>
                    </div>

                    {/* Rubric Scores */}
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Rubric Breakdown</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {Object.entries(result.scores).map(([key, score]) => {
                                const rubric = RUBRIC_LABELS[key] || { label: key, description: '' };
                                return (
                                    <div key={key} className="bg-white/5 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-white/70 text-sm">{rubric.label}</span>
                                            <span className={`text-xl font-bold ${getScoreColor(score)}`}>
                                                {score}/10
                                            </span>
                                        </div>
                                        <div className="w-full bg-white/10 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full transition-all ${
                                                    score >= 8 ? 'bg-green-500' :
                                                    score >= 6 ? 'bg-yellow-500' : 'bg-red-500'
                                                }`}
                                                style={{ width: `${score * 10}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Strengths */}
                    {result.strengths.length > 0 && (
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                <span className="text-green-400">+</span> Strengths
                            </h2>
                            <ul className="space-y-2">
                                {result.strengths.map((s, i) => (
                                    <li key={i} className="flex items-start gap-3 text-white/80">
                                        <span className="text-green-400 mt-1">+</span>
                                        <span>{s}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Areas for Improvement */}
                    {result.improvements.length > 0 && (
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                <span className="text-orange-400">!</span> Areas for Improvement
                            </h2>
                            <ul className="space-y-2">
                                {result.improvements.map((imp, i) => (
                                    <li key={i} className="flex items-start gap-3 text-white/80">
                                        <span className="text-orange-400 mt-1">!</span>
                                        <span>{imp}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Detailed Feedback */}
                    {result.detailedFeedback && (
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold text-white mb-3">Detailed Feedback</h2>
                            <div className="bg-white/5 rounded-xl p-4 text-white/80 leading-relaxed">
                                {result.detailedFeedback}
                            </div>
                        </div>
                    )}

                    {/* Rewrite Suggestion */}
                    {result.rewriteSuggestion && (
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                <span className="text-purple-400">*</span> Revision Suggestion
                            </h2>
                            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 text-white/80 leading-relaxed">
                                {result.rewriteSuggestion}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleReset}
                            className="px-6 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-500 transition"
                        >
                            Grade Another Essay
                        </button>
                    </div>
                </div>
            </div>
            </PageWrapper>
        );
    }

    // Input form
    return (
        <PageWrapper>
        <div className="max-w-4xl mx-auto p-6">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                <h1 className="text-2xl font-bold text-white mb-2">Essay Grader</h1>
                <p className="text-white/60 mb-6">
                    Get AI-powered feedback on your essay with detailed rubric scores and suggestions for improvement.
                </p>

                {/* Topic Input (Optional) */}
                <div className="mb-4">
                    <label className="block text-white/70 text-sm mb-2">
                        Essay Topic/Prompt <span className="text-white/40">(optional)</span>
                    </label>
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g., Discuss the impact of climate change on coastal cities"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 transition"
                    />
                </div>

                {/* Essay Input */}
                <div className="mb-4">
                    <label className="block text-white/70 text-sm mb-2">
                        Your Essay <span className="text-red-400">*</span>
                    </label>
                    <textarea
                        value={essay}
                        onChange={(e) => setEssay(e.target.value)}
                        placeholder="Paste or type your essay here..."
                        rows={15}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 transition resize-none"
                    />
                    <div className="flex justify-between mt-2 text-sm">
                        <span className="text-white/40">
                            {essay.length} characters
                        </span>
                        <span className="text-white/40">
                            Minimum 50 characters
                        </span>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-300 text-sm">
                        {error}
                    </div>
                )}

                {/* Rubric Preview */}
                <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
                    <h3 className="text-white/70 text-sm font-medium mb-3">Grading Criteria</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                        {Object.entries(RUBRIC_LABELS).map(([key, { label }]) => (
                            <div key={key} className="text-white/50">
                                • {label}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    onClick={handleGrade}
                    disabled={grading || essay.trim().length < 50}
                    className="w-full px-6 py-3 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    {grading ? 'Grading Essay...' : 'Grade My Essay'}
                </button>
            </div>
        </div>
        </PageWrapper>
    );
}
