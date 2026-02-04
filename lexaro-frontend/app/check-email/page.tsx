'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthShell from '@/components/auth/AuthShell';
import { resendVerification } from '@/lib/auth';

/**
 * Email icon component for the check-email page.
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

const COOLDOWN_SECONDS = 60;

export default function CheckEmailPage() {
    const searchParams = useSearchParams();
    const email = searchParams.get('email') ?? '';

    const [resending, setResending] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);
    const [resendError, setResendError] = useState<string | null>(null);
    const [cooldown, setCooldown] = useState(0);

    // Handle cooldown timer
    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setInterval(() => {
            setCooldown((c) => Math.max(0, c - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [cooldown]);

    const handleResend = useCallback(async () => {
        if (!email || resending || cooldown > 0) return;

        setResending(true);
        setResendError(null);
        setResendSuccess(false);

        try {
            await resendVerification(email);
            setResendSuccess(true);
            setCooldown(COOLDOWN_SECONDS);
        } catch (err: any) {
            const status = err?.response?.status;
            if (status === 429) {
                setResendError('Please wait before requesting another email.');
                setCooldown(COOLDOWN_SECONDS);
            } else {
                setResendError(err?.response?.data?.message ?? 'Failed to resend email.');
            }
        } finally {
            setResending(false);
        }
    }, [email, resending, cooldown]);

    const canResend = !resending && cooldown <= 0 && email;

    return (
        <AuthShell
            title="Check your email"
            subtitle={
                email
                    ? `We sent a verification link to ${email}`
                    : 'We sent a verification link to your email address'
            }
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
            <div className="flex flex-col items-center text-center space-y-6">
                <div className="p-4 rounded-full bg-white/5">
                    <EmailIcon />
                </div>

                <div className="space-y-2">
                    <p className="text-sm text-white/70">
                        Click the link in your email to verify your account and get started.
                    </p>
                    <p className="text-xs text-white/50">
                        Don&apos;t see it? Check your spam folder.
                    </p>
                </div>

                {/* Resend button */}
                <button
                    onClick={handleResend}
                    disabled={!canResend}
                    className="btn-secondary text-sm"
                >
                    {resending
                        ? 'Sending...'
                        : cooldown > 0
                          ? `Resend in ${cooldown}s`
                          : 'Resend verification email'}
                </button>

                {/* Success message */}
                {resendSuccess && (
                    <p className="text-sm text-green-400">
                        Verification email sent!
                    </p>
                )}

                {/* Error message */}
                {resendError && (
                    <p className="text-sm text-red-400">
                        {resendError}
                    </p>
                )}
            </div>
        </AuthShell>
    );
}
