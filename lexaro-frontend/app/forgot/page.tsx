'use client';

import { useState } from 'react';
import Link from 'next/link';
import AuthShell from '@/components/auth/AuthShell';
import { forgotPassword } from '@/lib/auth';

/**
 * Email icon for the forgot password page.
 */
function EmailIcon() {
    return (
        <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            className="text-[var(--accent)]"
        >
            <rect
                x="2"
                y="4"
                width="20"
                height="16"
                rx="3"
                stroke="currentColor"
                strokeWidth="1.5"
            />
            <path
                d="M2 7l8.165 5.715a3 3 0 003.67 0L22 7"
                stroke="currentColor"
                strokeWidth="1.5"
            />
        </svg>
    );
}

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const canSubmit = email.trim().length > 0 && !loading;

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!canSubmit) return;

        setLoading(true);
        try {
            await forgotPassword(email.trim());
        } catch {
            // Silently ignore errors to prevent email enumeration
        } finally {
            setLoading(false);
            setSubmitted(true);
        }
    };

    // Success state - always shown after submission
    if (submitted) {
        return (
            <AuthShell
                title="Check your email"
                subtitle="If an account exists, we've sent password reset instructions."
                footer={
                    <>
                        <Link
                            href="/login"
                            className="underline decoration-white/40 hover:decoration-white/80"
                        >
                            Back to login
                        </Link>
                    </>
                }
            >
                <div className="flex flex-col items-center text-center space-y-6 py-4">
                    <div className="p-4 rounded-full bg-white/5">
                        <EmailIcon />
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-white/70">
                            Check your inbox for a link to reset your password.
                        </p>
                        <p className="text-xs text-white/50">
                            Don&apos;t see it? Check your spam folder.
                        </p>
                    </div>
                </div>
            </AuthShell>
        );
    }

    // Form state
    return (
        <AuthShell
            title="Forgot your password?"
            subtitle="Enter your email and we'll send you a reset link."
            footer={
                <>
                    Remember your password?{' '}
                    <Link
                        href="/login"
                        className="underline decoration-white/40 hover:decoration-white/80"
                    >
                        Log in
                    </Link>
                </>
            }
        >
            <form onSubmit={onSubmit} className="space-y-4">
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="input"
                    required
                />

                <button
                    type="submit"
                    disabled={!canSubmit}
                    className="btn-primary w-full"
                >
                    {loading ? 'Sending...' : 'Send reset link'}
                </button>
            </form>
        </AuthShell>
    );
}
