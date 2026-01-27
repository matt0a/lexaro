'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
    Quiz,
    QuizQuestion,
    QuizGradeResponse,
    generateQuiz,
    getQuizzesForDocument,
    gradeQuiz,
    deleteQuiz
} from '@/lib/educationApi';

type ViewMode = 'list' | 'generate' | 'take' | 'results';

export default function EducationDocQuizzesPage() {
    const params = useParams();
    const docId = Number(params.id);

    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [grading, setGrading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [gradeResult, setGradeResult] = useState<QuizGradeResponse | null>(null);

    // Generation options
    const [questionCount, setQuestionCount] = useState(5);
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

    // Load quizzes on mount
    useEffect(() => {
        loadQuizzes();
    }, [docId]);

    async function loadQuizzes() {
        setLoading(true);
        setError(null);
        try {
            const data = await getQuizzesForDocument(docId);
            setQuizzes(data);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to load quizzes');
        } finally {
            setLoading(false);
        }
    }

    async function handleGenerate() {
        setGenerating(true);
        setError(null);
        try {
            const quiz = await generateQuiz(docId, { questionCount, difficulty });
            setQuizzes(prev => [quiz, ...prev]);
            setCurrentQuiz(quiz);
            setAnswers({});
            setViewMode('take');
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to generate quiz');
        } finally {
            setGenerating(false);
        }
    }

    async function handleGrade() {
        if (!currentQuiz) return;
        setGrading(true);
        setError(null);
        try {
            const result = await gradeQuiz(currentQuiz.id, answers);
            setGradeResult(result);
            setViewMode('results');
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to grade quiz');
        } finally {
            setGrading(false);
        }
    }

    async function handleDelete(quizId: number) {
        if (!confirm('Are you sure you want to delete this quiz?')) return;
        try {
            await deleteQuiz(quizId);
            setQuizzes(prev => prev.filter(q => q.id !== quizId));
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to delete quiz');
        }
    }

    function startQuiz(quiz: Quiz) {
        setCurrentQuiz(quiz);
        setAnswers({});
        setGradeResult(null);
        setViewMode('take');
    }

    function selectAnswer(questionId: number, answerIndex: number) {
        setAnswers(prev => ({ ...prev, [questionId]: answerIndex }));
    }

    // Calculate progress
    const answeredCount = currentQuiz ? Object.keys(answers).length : 0;
    const totalQuestions = currentQuiz?.questionCount || 0;

    // Render based on view mode
    if (viewMode === 'generate') {
        return (
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Generate New Quiz</h2>

                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-white/70 text-sm mb-2">Number of Questions</label>
                        <div className="flex gap-2">
                            {[5, 10, 15, 20].map(n => (
                                <button
                                    key={n}
                                    onClick={() => setQuestionCount(n)}
                                    className={`px-4 py-2 rounded-lg transition ${
                                        questionCount === n
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                                    }`}
                                >
                                    {n}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-white/70 text-sm mb-2">Difficulty</label>
                        <div className="flex gap-2">
                            {(['easy', 'medium', 'hard'] as const).map(d => (
                                <button
                                    key={d}
                                    onClick={() => setDifficulty(d)}
                                    className={`px-4 py-2 rounded-lg capitalize transition ${
                                        difficulty === d
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                                    }`}
                                >
                                    {d}
                                </button>
                            ))}
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
                        onClick={handleGenerate}
                        disabled={generating}
                        className="px-6 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        {generating ? 'Generating...' : 'Generate Quiz'}
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className="px-6 py-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    if (viewMode === 'take' && currentQuiz) {
        return (
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-white">{currentQuiz.title}</h2>
                    <span className="text-white/50 text-sm">
                        {answeredCount} / {totalQuestions} answered
                    </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-white/10 rounded-full h-2 mb-6">
                    <div
                        className="bg-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                    />
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-300 text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-6 mb-6">
                    {currentQuiz.questions.map((q, idx) => (
                        <QuestionCard
                            key={q.id}
                            question={q}
                            index={idx}
                            selectedAnswer={answers[q.id]}
                            onSelect={(answerIdx) => selectAnswer(q.id, answerIdx)}
                            showAnswer={false}
                        />
                    ))}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleGrade}
                        disabled={grading || answeredCount === 0}
                        className="px-6 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        {grading ? 'Grading...' : 'Submit Quiz'}
                    </button>
                    <button
                        onClick={() => {
                            setViewMode('list');
                            setCurrentQuiz(null);
                        }}
                        className="px-6 py-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    if (viewMode === 'results' && gradeResult) {
        const scoreColor = gradeResult.scorePercent >= 80 ? 'text-green-400' :
            gradeResult.scorePercent >= 60 ? 'text-yellow-400' : 'text-red-400';

        return (
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Quiz Results</h2>

                {/* Score summary */}
                <div className="bg-white/5 rounded-xl p-6 mb-6 text-center">
                    <div className={`text-5xl font-bold mb-2 ${scoreColor}`}>
                        {gradeResult.scorePercent.toFixed(0)}%
                    </div>
                    <div className="text-white/70">
                        {gradeResult.correctCount} correct out of {gradeResult.totalQuestions} questions
                    </div>
                </div>

                {/* Weak topics */}
                {gradeResult.weakTopics.length > 0 && (
                    <div className="mb-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                        <h3 className="text-orange-400 font-medium mb-2">Areas to Review</h3>
                        <ul className="text-white/70 text-sm space-y-1">
                            {gradeResult.weakTopics.map((topic, i) => (
                                <li key={i}>• {topic}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Question results */}
                <div className="space-y-4 mb-6">
                    {gradeResult.results.map((r, idx) => (
                        <div
                            key={r.questionId}
                            className={`p-4 rounded-xl border ${
                                r.correct
                                    ? 'bg-green-500/10 border-green-500/20'
                                    : 'bg-red-500/10 border-red-500/20'
                            }`}
                        >
                            <div className="flex items-start gap-3 mb-3">
                                <span className={`text-xl ${r.correct ? 'text-green-400' : 'text-red-400'}`}>
                                    {r.correct ? '✓' : '✗'}
                                </span>
                                <div>
                                    <span className="text-white/50 text-sm">Question {idx + 1}</span>
                                    <p className="text-white">{r.prompt}</p>
                                </div>
                            </div>

                            <div className="ml-8 space-y-1 text-sm">
                                {r.choices.map((choice, ci) => {
                                    const isCorrect = ci === r.correctAnswerIndex;
                                    const isUserAnswer = ci === r.userAnswerIndex;
                                    return (
                                        <div
                                            key={ci}
                                            className={`flex items-center gap-2 ${
                                                isCorrect ? 'text-green-400' :
                                                    isUserAnswer && !isCorrect ? 'text-red-400' : 'text-white/50'
                                            }`}
                                        >
                                            {isCorrect && '✓'}
                                            {isUserAnswer && !isCorrect && '✗'}
                                            {!isCorrect && !isUserAnswer && '○'}
                                            <span>{choice}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {r.explanation && (
                                <div className="ml-8 mt-3 p-3 rounded-lg bg-white/5 text-white/70 text-sm">
                                    <strong>Explanation:</strong> {r.explanation}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => {
                            setViewMode('list');
                            setCurrentQuiz(null);
                            setGradeResult(null);
                        }}
                        className="px-6 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-500 transition"
                    >
                        Back to Quizzes
                    </button>
                    <button
                        onClick={() => setViewMode('generate')}
                        className="px-6 py-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition"
                    >
                        Generate New Quiz
                    </button>
                </div>
            </div>
        );
    }

    // Default: list view
    return (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">Quizzes</h2>
                <button
                    onClick={() => setViewMode('generate')}
                    className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-500 transition"
                >
                    + Generate Quiz
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-300 text-sm">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="text-white/50 text-center py-8">Loading quizzes...</div>
            ) : quizzes.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-white/30 text-4xl mb-4">📝</div>
                    <p className="text-white/70 mb-4">No quizzes yet</p>
                    <p className="text-white/50 text-sm mb-6">
                        Generate a quiz to test your understanding of this document.
                    </p>
                    <button
                        onClick={() => setViewMode('generate')}
                        className="px-6 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-500 transition"
                    >
                        Generate Your First Quiz
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {quizzes.map(quiz => (
                        <div
                            key={quiz.id}
                            className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition"
                        >
                            <div>
                                <h3 className="text-white font-medium">{quiz.title}</h3>
                                <p className="text-white/50 text-sm">
                                    {quiz.questionCount} questions • {new Date(quiz.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => startQuiz(quiz)}
                                    className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-500 transition"
                                >
                                    Take Quiz
                                </button>
                                <button
                                    onClick={() => handleDelete(quiz.id)}
                                    className="px-3 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Question card component
function QuestionCard({
    question,
    index,
    selectedAnswer,
    onSelect,
    showAnswer
}: {
    question: QuizQuestion;
    index: number;
    selectedAnswer?: number;
    onSelect: (idx: number) => void;
    showAnswer: boolean;
}) {
    return (
        <div className="p-4 rounded-xl bg-white/5">
            <p className="text-white/50 text-sm mb-1">Question {index + 1}</p>
            <p className="text-white mb-4">{question.prompt}</p>

            <div className="space-y-2">
                {question.choices.map((choice, ci) => {
                    const isSelected = selectedAnswer === ci;
                    const isCorrect = showAnswer && ci === question.answerIndex;
                    const isWrong = showAnswer && isSelected && ci !== question.answerIndex;

                    return (
                        <button
                            key={ci}
                            onClick={() => !showAnswer && onSelect(ci)}
                            disabled={showAnswer}
                            className={`w-full text-left p-3 rounded-lg border transition ${
                                isCorrect ? 'bg-green-500/20 border-green-500/50 text-green-300' :
                                    isWrong ? 'bg-red-500/20 border-red-500/50 text-red-300' :
                                        isSelected ? 'bg-purple-600/30 border-purple-500/50 text-white' :
                                            'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                            }`}
                        >
                            <span className="font-medium mr-2">
                                {String.fromCharCode(65 + ci)}.
                            </span>
                            {choice}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
