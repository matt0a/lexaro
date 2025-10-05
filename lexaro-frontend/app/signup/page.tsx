'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signup } from '@/lib/auth';

export default function SignupPage() {
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
            await signup(email, password);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err?.response?.data?.message ?? 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid place-items-center px-4">
            <div className="w-full max-w-sm card p-6">
                <h1 className="text-2xl font-semibold">Create your account</h1>
                <p className="text-sm text-white/70 mt-1">
                    Start listening and translating your documents in seconds.
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
                        name="new-password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        className="input"
                        required
                    />

                    {error && <p className="text-sm text-red-300">{error}</p>}

                    <button type="submit" disabled={loading} className="btn btn-primary w-full">
                        {loading ? 'Creating…' : 'Create account'}
                    </button>
                </form>

                <p className="text-sm mt-4 text-white/80">
                    Already have an account?{' '}
                    <Link href="/login" className="underline decoration-indigo/70 hover:decoration-indigo">
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
}
