'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthShell from '@/components/auth/AuthShell';
import { verifyEmail } from '@/lib/auth';

/**
 * Spinner component shown during verification.
 */
function Spinner() {
    return (
        <svg
            className="animate-spin h-8 w-8 text-[var(--accent)]"
            viewBox="0 0 24 24"
            fill="none"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
        </svg>
    );
}

/**
 * Checkmark icon shown on successful verification.
 */
function CheckIcon() {
    return (
        <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            className="text-green-400"
        >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <path
                d="M8 12l2.5 2.5L16 9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

/**
 * Error icon shown on verification failure.
 */
function ErrorIcon() {
    return (
        <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            className="text-red-400"
        >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <path
                d="M15 9l-6 6M9 9l6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />
        </svg>
    );
}

type VerifyState = 'loading' | 'success' | 'error';

export default function VerifyPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [state, setState] = useState<VerifyState>('loading');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!token) {
            setState('error');
            setErrorMessage('No verification token provided.');
            return;
        }

        const verify = async () => {
            try {
                await verifyEmail(token);
                setState('success');
                // Redirect to dashboard after brief success display
                setTimeout(() => {
                    router.push('/dashboard');
                }, 1500);
            } catch (err: any) {
                setState('error');
                const message = err?.response?.data?.message ?? err?.response?.data?.error;
                setErrorMessage(message ?? 'Verification failed. The link may be expired or invalid.');
            }
        };

        verify();
    }, [token, router]);

    if (state === 'loading') {
        return (
            <AuthShell title="Verifying your email" subtitle="Please wait...">
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    <Spinner />
                    <p className="text-sm text-white/70">Verifying your account...</p>
                </div>
            </AuthShell>
        );
    }

    if (state === 'success') {
        return (
            <AuthShell title="Email verified!" subtitle="Your account is now active.">
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    <CheckIcon />
                    <p className="text-sm text-white/70">Redirecting to dashboard...</p>
                </div>
            </AuthShell>
        );
    }

    // Error state
    return (
        <AuthShell
            title="Verification failed"
            subtitle={errorMessage ?? 'Something went wrong.'}
            footer={
                <>
                    Need help?{' '}
                    <Link
                        href="/signup"
                        className="underline decoration-white/40 hover:decoration-white/80"
                    >
                        Sign up again
                    </Link>{' '}
                    or{' '}
                    <Link
                        href="/login"
                        className="underline decoration-white/40 hover:decoration-white/80"
                    >
                        Log in
                    </Link>
                </>
            }
        >
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <ErrorIcon />
                <p className="text-sm text-white/70 text-center">
                    The verification link may have expired or already been used.
                </p>
            </div>
        </AuthShell>
    );
}
