'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login } from '@/lib/auth';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const data = await login(email, password);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err?.response?.data?.message ?? 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid place-items-center px-4">
            <div className="w-full max-w-sm card p-6">
                <h1 className="text-2xl font-semibold">Welcome back</h1>
                <p className="text-sm text-white/70 mt-1">
                    Enter your email and password to continue.
                </p>

                <form onSubmit={onSubmit} className="mt-6 space-y-3" autoComplete="on">
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
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        className="input"
                        required
                    />
                    {error && <p className="text-sm text-red-300">{error}</p>}

                    <button type="submit" disabled={loading} className="btn btn-primary w-full">
                        {loading ? 'Logging in…' : 'Login'}
                    </button>
                </form>

                <p className="text-sm mt-4 text-white/80">
                    Don&apos;t have an account?{' '}
                    <Link href="/signup" className="underline decoration-indigo/70 hover:decoration-indigo">
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    );
}
