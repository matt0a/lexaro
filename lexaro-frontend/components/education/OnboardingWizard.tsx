'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    X,
    Upload,
    MessageSquare,
    FileText,
    CheckCircle2,
    ArrowRight,
    Sparkles,
    BookOpen,
    Layers,
    ChevronRight,
} from 'lucide-react';
import { completeOnboarding } from '@/lib/educationApi';

/**
 * Props for OnboardingWizard component.
 */
type OnboardingWizardProps = {
    onComplete: () => void;
    onDismiss: () => void;
};

/**
 * Onboarding wizard for new education users.
 * Guides users through: Welcome → Upload Doc → Explore Features → Complete
 */
export default function OnboardingWizard({ onComplete, onDismiss }: OnboardingWizardProps) {
    const [step, setStep] = useState(0);
    const [completing, setCompleting] = useState(false);

    const steps = [
        { title: 'Welcome', icon: Sparkles },
        { title: 'Upload', icon: Upload },
        { title: 'Explore', icon: BookOpen },
        { title: 'Ready!', icon: CheckCircle2 },
    ];

    /**
     * Handle completing the onboarding.
     */
    const handleComplete = async () => {
        setCompleting(true);
        try {
            await completeOnboarding();
            onComplete();
        } catch (err) {
            console.error('Failed to complete onboarding:', err);
            // Still close the wizard even if API fails
            onComplete();
        }
    };

    /**
     * Handle skipping/dismissing onboarding.
     */
    const handleSkip = async () => {
        try {
            await completeOnboarding();
        } catch (err) {
            console.error('Failed to skip onboarding:', err);
        }
        onDismiss();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={handleSkip}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-gradient-to-b from-gray-900 to-black border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
                {/* Close button */}
                <button
                    onClick={handleSkip}
                    className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors z-10"
                >
                    <X className="h-4 w-4 text-white/60" />
                </button>

                {/* Progress indicator */}
                <div className="flex justify-center gap-2 pt-6 pb-2">
                    {steps.map((s, i) => (
                        <div
                            key={i}
                            className={`h-1.5 w-8 rounded-full transition-all duration-300 ${
                                i <= step ? 'bg-purple-500' : 'bg-white/10'
                            }`}
                        />
                    ))}
                </div>

                {/* Content */}
                <div className="px-8 py-6">
                    {step === 0 && (
                        <div className="text-center animate-fade-in">
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mb-6">
                                <Sparkles className="h-8 w-8 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-3">
                                Welcome to Lexaro Learn!
                            </h2>
                            <p className="text-white/60 mb-6">
                                Your AI-powered study companion. Upload any document and we'll help you
                                create quizzes, flashcards, notes, and more.
                            </p>
                            <div className="flex flex-col gap-3 text-left bg-white/5 rounded-xl p-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 rounded-lg bg-blue-500/20">
                                        <MessageSquare className="h-4 w-4 text-blue-400" />
                                    </div>
                                    <span className="text-sm text-white/80">Chat with AI about your documents</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 rounded-lg bg-green-500/20">
                                        <Layers className="h-4 w-4 text-green-400" />
                                    </div>
                                    <span className="text-sm text-white/80">Generate flashcards & quizzes</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 rounded-lg bg-amber-500/20">
                                        <FileText className="h-4 w-4 text-amber-400" />
                                    </div>
                                    <span className="text-sm text-white/80">Create smart study notes</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="text-center animate-fade-in">
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-6">
                                <Upload className="h-8 w-8 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-3">
                                Upload Your First Document
                            </h2>
                            <p className="text-white/60 mb-6">
                                Start by uploading a PDF, Word document, or text file. We'll extract
                                the content and make it searchable for AI features.
                            </p>
                            <div className="bg-white/5 rounded-xl p-5 mb-6">
                                <div className="text-sm text-white/50 mb-3">Supported formats:</div>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {['PDF', 'DOCX', 'DOC', 'TXT', 'EPUB'].map((fmt) => (
                                        <span
                                            key={fmt}
                                            className="px-3 py-1 rounded-full bg-white/10 text-sm text-white/70"
                                        >
                                            {fmt}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <Link
                                href="/education/library?create=1"
                                onClick={() => setStep(2)}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-medium transition-colors"
                            >
                                <Upload className="h-4 w-4" />
                                Upload Document
                            </Link>
                            <button
                                onClick={() => setStep(2)}
                                className="block mx-auto mt-3 text-sm text-white/50 hover:text-white/70 transition-colors"
                            >
                                Skip for now
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="text-center animate-fade-in">
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6">
                                <BookOpen className="h-8 w-8 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-3">
                                Explore Study Tools
                            </h2>
                            <p className="text-white/60 mb-6">
                                Once you have a document, you can use these powerful AI features
                                to supercharge your studying.
                            </p>
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex flex-col items-center gap-2">
                                    <MessageSquare className="h-6 w-6 text-blue-400" />
                                    <span className="text-sm text-white/80">AI Tutor</span>
                                </div>
                                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex flex-col items-center gap-2">
                                    <Layers className="h-6 w-6 text-green-400" />
                                    <span className="text-sm text-white/80">Flashcards</span>
                                </div>
                                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center gap-2">
                                    <FileText className="h-6 w-6 text-amber-400" />
                                    <span className="text-sm text-white/80">Quizzes</span>
                                </div>
                                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 flex flex-col items-center gap-2">
                                    <BookOpen className="h-6 w-6 text-purple-400" />
                                    <span className="text-sm text-white/80">Smart Notes</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="text-center animate-fade-in">
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6">
                                <CheckCircle2 className="h-8 w-8 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-3">
                                You're All Set!
                            </h2>
                            <p className="text-white/60 mb-6">
                                You're ready to start studying smarter. Upload a document and let
                                AI help you learn more effectively.
                            </p>
                            <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl p-4 border border-purple-500/30 mb-6">
                                <div className="flex items-center gap-3">
                                    <Sparkles className="h-5 w-5 text-purple-400" />
                                    <div className="text-left">
                                        <div className="font-medium text-white">Pro Tip</div>
                                        <div className="text-sm text-white/60">
                                            Try asking the AI Tutor to explain difficult concepts in simple terms!
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 pb-8 flex justify-between items-center">
                    {step > 0 ? (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="px-4 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            Back
                        </button>
                    ) : (
                        <div />
                    )}

                    {step < 3 ? (
                        <button
                            onClick={() => setStep(step + 1)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-medium transition-colors"
                        >
                            Continue
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleComplete}
                            disabled={completing}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium transition-colors disabled:opacity-50"
                        >
                            {completing ? 'Starting...' : 'Get Started'}
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Animations */}
            <style jsx>{`
                @keyframes scale-in {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
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
                .animate-scale-in {
                    animation: scale-in 0.3s ease-out forwards;
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
}
