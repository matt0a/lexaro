'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signup } from '@/lib/auth';
import AuthShell from '@/components/auth/AuthShell';

function EyeIcon({ open }: { open: boolean }) {
    return open ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90">
            <path
                d="M2.25 12s3.75-7.5 9.75-7.5S21.75 12 21.75 12 18 19.5 12 19.5 2.25 12 2.25 12Z"
                stroke="currentColor"
                strokeWidth="1.8"
            />
            <path
                d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                stroke="currentColor"
                strokeWidth="1.8"
            />
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

type Strength = {
    score: number; // 0..4
    label: string;
};

function getPasswordStrength(pw: string): Strength {
    const p = pw ?? '';
    if (!p) return { score: 0, label: 'Enter a password' };

    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;

    const label =
        score <= 1 ? 'Weak' :
            score === 2 ? 'Okay' :
                score === 3 ? 'Good' :
                    'Strong';

    // If length < 8, keep it in weak bucket visually
    if (p.length < 8) return { score: 1, label: 'Too short' };

    return { score, label };
}

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    const strength = useMemo(() => getPasswordStrength(password), [password]);
    const passwordsMatch = useMemo(() => {
        if (!confirmPassword) return true; // don’t show mismatch too early
        return password === confirmPassword;
    }, [password, confirmPassword]);

    const canSubmit = useMemo(() => {
        if (!email.trim()) return false;
        if (password.length < 8) return false;
        if (!confirmPassword) return false;
        if (password !== confirmPassword) return false;
        return true;
    }, [email, password, confirmPassword]);

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

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
            await signup(email, password);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err?.response?.data?.message ?? 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    // Bar fill 0..100%
    const fillPct = useMemo(() => {
        // Map score (0..4) to percentage
        const score = strength.score;
        if (score <= 0) return 0;
        return Math.min(100, (score / 4) * 100);
    }, [strength.score]);

    return (
        <AuthShell
            title="Create your account"
            subtitle="Start listening and translating your documents in seconds."
            footer={
                <>
                    Already have an account?{' '}
                    <Link href="/login" className="underline decoration-white/40 hover:decoration-white/80">
                        Log in
                    </Link>
                </>
            }
        >
            <form onSubmit={onSubmit} className="space-y-3" autoComplete="on">
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

                {/* Password */}
                <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        name="new-password"
                        placeholder="Password"
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

                {/* Strength bar */}
                <div className="space-y-1.5">
                    <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
                            style={{ width: `${fillPct}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between text-xs">
            <span className="text-white/60">
              Minimum <span className="text-white/80 font-medium">8 characters</span>
            </span>
                        <span className="text-white/75">{strength.label}</span>
                    </div>
                </div>

                {/* Confirm password */}
                <div className="relative">
                    <input
                        type={showConfirm ? 'text' : 'password'}
                        name="confirm-password"
                        placeholder="Confirm password"
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

                {!passwordsMatch && (
                    <p className="text-xs text-red-300">Passwords don’t match.</p>
                )}

                {error && <p className="form-error">{error}</p>}

                <button type="submit" disabled={loading || !canSubmit} className="btn-primary w-full">
                    {loading ? 'Creating…' : 'Create account'}
                </button>
            </form>
        </AuthShell>
    );
}
