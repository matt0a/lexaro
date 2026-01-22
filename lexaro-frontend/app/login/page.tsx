'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login } from '@/lib/auth';
import AuthShell from '@/components/auth/AuthShell';

function EyeIcon({ open }: { open: boolean }) {
    return open ? (
        // Eye (visible)
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
        // Eye off (hidden)
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90">
            <path
                d="M3 3l18 18"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
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

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [showPassword, setShowPassword] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    const canSubmit = useMemo(() => {
        if (!email.trim()) return false;
        if (!password) return false;
        if (password.length < 8) return false;
        return true;
    }, [email, password]);

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        setLoading(true);
        try {
            await login(email, password);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err?.response?.data?.message ?? 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell
            title="Welcome back"
            subtitle="Enter your email and password to continue."
            footer={
                <>
                    Don&apos;t have an account?{' '}
                    <Link href="/signup" className="underline decoration-white/40 hover:decoration-white/80">
                        Create one
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

                <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
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

                {error && <p className="form-error">{error}</p>}

                <button type="submit" disabled={loading || !canSubmit} className="btn-primary w-full">
                    {loading ? 'Logging in…' : 'Login'}
                </button>
            </form>
        </AuthShell>
    );
}
