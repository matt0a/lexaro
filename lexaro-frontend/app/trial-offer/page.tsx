'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import api from '@/lib/api';
import UploadSection from '@/components/upload/UploadSection';

type MeUsage = {
    plan: 'FREE' | 'PREMIUM' | 'PREMIUM_PLUS' | string;
    monthlyUsed: number;
    dailyUsed: number;
};

export default function Dashboard() {
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

    if (loading) return <div className="min-h-screen grid place-items-center">Loading…</div>;
    if (!me) return null;

    const isFree = me.plan?.toUpperCase() === 'FREE';

    return (
        <div className="min-h-screen bg-black text-white">
            <Sidebar />

            <main className="ml-56 px-6 py-10">
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Library</h1>
                        <p className="text-white/60 mt-1">
                            {isFree ? 'Free plan — some features are limited.'
                                : 'Premium — enjoy cloud imports and faster voices.'}
                        </p>
                    </div>

                    {/* plan pill */}
                    <div className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-xs">
                        Plan: <span className="font-medium">{me.plan}</span>
                    </div>
                </header>

                {/* usage summary */}
                <section className="mt-6 grid sm:grid-cols-3 gap-4">
                    <Card label="Plan" value={me.plan} />
                    <Card label="Monthly Used" value={me.monthlyUsed.toLocaleString()} />
                    <Card label="Daily Used" value={me.dailyUsed.toLocaleString()} />
                </section>

                {/* upload section */}
                <div className="mt-8">
                    <UploadSection plan={me.plan} />
                </div>
            </main>
        </div>
    );
}

function Card({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-sm text-white/60">{label}</div>
            <div className="text-xl font-semibold mt-1">{value}</div>
        </div>
    );
}
