'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import UploadSection from '@/components/upload/UploadSection';
import api from '@/lib/api';

type MeUsage = {
    plan: 'FREE' | 'PREMIUM' | 'PREMIUM_PLUS' | 'BUSINESS' | 'BUSINESS_PLUS' | string;
    monthlyUsed: number;
    dailyUsed: number;
    email?: string; // if your /me/usage includes it; otherwise Sidebar fetches /me
};

export default function DashboardPage() {
    const router = useRouter();
    const params = useSearchParams();
    const [me, setMe] = useState<MeUsage | null>(null);
    const [loading, setLoading] = useState(true);

    const shouldOpenUpload = params.get('open') === 'upload';

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

    return (
        <div className="min-h-screen bg-black text-white">
            <Sidebar />
            <main className="ml-56">
                {/* subtle top vignette */}
                <div className="relative overflow-hidden">
                    <div className="pointer-events-none absolute -inset-x-24 -top-32 h-48 bg-[radial-gradient(700px_250px_at_50%_0%,rgba(255,255,255,.06),transparent)]" />
                </div>

                <div className="px-6 py-10 max-w-6xl mx-auto">
                    {/* Removed: header + usage cards */}
                    <div className="mt-2">
                        <UploadSection plan={me.plan} initialOpenUpload={shouldOpenUpload} />
                    </div>

                    {/* bottom vignette */}
                    <div className="pointer-events-none mt-16 h-40 bg-[radial-gradient(700px_250px_at_50%_100%,rgba(255,255,255,.05),transparent)]" />
                </div>
            </main>
        </div>
    );
}
