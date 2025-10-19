'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import UploadSection from '@/components/upload/UploadSection';
import api from '@/lib/api';

type MeUsage = {
    plan: 'FREE' | 'PREMIUM' | 'PREMIUM_PLUS' | 'BUSINESS' | 'BUSINESS_PLUS' | string;
    monthlyUsed: number;
    dailyUsed: number;
};

export default function DashboardPage() {
    const router = useRouter();
    const [me, setMe] = useState<MeUsage | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) { router.replace('/login'); return; }

        (async () => {
            try {
                const res = await api.get<MeUsage>('/me/usage');
                setMe(res.data);
            } catch {
                router.replace('/login');
            } finally {
                setLoading(false);
            }
        })();
    }, [router]);

    if (loading) return <div className="min-h-screen grid place-items-center text-white bg-black">Loading…</div>;
    if (!me) return null;

    const isFree = me.plan?.toUpperCase() === 'FREE';

    return (
        <div className="min-h-screen bg-black text-white">
            <Sidebar />

            {/* page content */}
            <main className="ml-56">
                {/* subtle top vignette to match home page feel */}
                <div className="relative overflow-hidden">
                    <div className="pointer-events-none absolute -inset-x-24 -top-32 h-48 bg-[radial-gradient(700px_250px_at_50%_0%,rgba(255,255,255,.06),transparent)]" />
                </div>

                <div className="px-6 py-10 max-w-6xl mx-auto">
                    <header className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold">Dashboard</h1>
                            <p className="text-white/60 mt-1">Current usage and a live audio job tracker.</p>
                        </div>
                        <div className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-xs">
                            Plan: <span className="font-medium">{me.plan}</span>
                        </div>
                    </header>

                    {/* usage summary cards */}
                    <section className="mt-6 grid sm:grid-cols-3 gap-4">
                        <Card label="Plan" value={me.plan} />
                        <Card label="Monthly Used" value={me.monthlyUsed.toLocaleString()} />
                        <Card label="Daily Used" value={me.dailyUsed.toLocaleString()} />
                    </section>

                    {/* upload + TTS flow */}
                    <div className="mt-10">
                        <UploadSection plan={me.plan} />
                    </div>

                    {/* small footer vignette to echo landing */}
                    <div className="pointer-events-none mt-16 h-40 bg-[radial-gradient(700px_250px_at_50%_100%,rgba(255,255,255,.05),transparent)]" />
                </div>
            </main>
        </div>
    );
}

function Card({ label, value }: { label: string; value: string }) {
    return (
        <div className="card bg-white/[0.03] border border-white/10 rounded-2xl p-5">
            <div className="text-sm text-white/60">{label}</div>
            <div className="text-xl font-semibold mt-1">{value}</div>
        </div>
    );
}
