'use client';

import { useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthShell from '@/components/auth/AuthShell';
import { resetPassword } from '@/lib/auth';

/**
 * Eye icon component for password visibility toggle.
 */
function EyeIcon({ open }: { open: boolean }) {
    return open ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90">
            <path
                d="M2.25 12s3.75-7.5 9.75-7.5S21.75 12 21.75 12 18 19.5 12 19.5 2.25 12 2.25 12Z"
                stroke="currentColor"
                strokeWidth="1.8"
            />
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="1.8" />
        </svg>
    ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90">
            <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path
                d="M10.6 10.6A2.95 2.95 0 0 0 9 13a3 3 0 0 0 5.4 1.8"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
            <path
                d="M6.6 6.6C4.3 8.2 2.7 10.6 2.25 12c0 0 3.75 7.5 9.75 7.5 1.6 0 3-.3 4.3-.9"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
            <path
                d="M9.9 4.7c.7-.1 1.4-.2 2.1-.2 6 0 9.75 7.5 9.75 7.5 0 0-1.2 2.4-3.4 4.4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
        </svg>
    );
}

/**
 * Checkmark icon for success state.
 */
function CheckIcon() {
    return (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-green-400">
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

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const passwordsMatch = useMemo(() => {
        if (!confirmPassword) return true;
        return password === confirmPassword;
    }, [password, confirmPassword]);

    const canSubmit = useMemo(() => {
        if (password.length < 8) return false;
        if (!confirmPassword) return false;
        if (password !== confirmPassword) return false;
        return true;
    }, [password, confirmPassword]);

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        if (!token) {
            setError('Invalid reset link. Please request a new one.');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            await resetPassword(token, password);
            setSuccess(true);
            // Redirect to login after showing success
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (err: any) {
            const message = err?.response?.data?.error ?? err?.response?.data?.message;
            setError(message ?? 'Failed to reset password. The link may be expired.');
        } finally {
            setLoading(false);
        }
    };

    // No token provided
    if (!token) {
        return (
            <AuthShell
                title="Invalid link"
                subtitle="This password reset link is invalid or missing."
                footer={
                    <>
                        <Link
                            href="/forgot"
                            className="underline decoration-white/40 hover:decoration-white/80"
                        >
                            Request a new reset link
                        </Link>
                    </>
                }
            >
                <div className="py-4 text-center">
                    <p className="text-sm text-white/70">
                        Please use the link from your password reset email.
                    </p>
                </div>
            </AuthShell>
        );
    }

    // Success state
    if (success) {
        return (
            <AuthShell title="Password reset!" subtitle="Your password has been changed.">
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    <CheckIcon />
                    <p className="text-sm text-white/70">Redirecting to login...</p>
                </div>
            </AuthShell>
        );
    }

    // Form state
    return (
        <AuthShell
            title="Reset your password"
            subtitle="Enter a new password for your account."
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
            <form onSubmit={onSubmit} className="space-y-3">
                {/* New password */}
                <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        name="new-password"
                        placeholder="New password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        className="input pr-12"
                        minLength={8}
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-xl hover:bg-white/10 active:scale-[.98]"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                        <EyeIcon open={showPassword} />
                    </button>
                </div>

                <p className="text-xs text-white/55">
                    Password must be at least <span className="text-white/80 font-medium">8 characters</span>.
                </p>

                {/* Confirm password */}
                <div className="relative">
                    <input
                        type={showConfirm ? 'text' : 'password'}
                        name="confirm-password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        className="input pr-12"
                        minLength={8}
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-xl hover:bg-white/10 active:scale-[.98]"
                        aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    >
                        <EyeIcon open={showConfirm} />
                    </button>
                </div>

                {!passwordsMatch && <p className="text-xs text-red-300">Passwords don&apos;t match.</p>}

                {error && <p className="form-error">{error}</p>}

                <button type="submit" disabled={loading || !canSubmit} className="btn-primary w-full">
                    {loading ? 'Resetting...' : 'Reset password'}
                </button>
            </form>
        </AuthShell>
    );
}
