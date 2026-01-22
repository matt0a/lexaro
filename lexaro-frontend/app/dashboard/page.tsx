'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import UploadSection from '@/components/upload/UploadSection';
import api from '@/lib/api';

// Landing background
import LightPillarsBackground from '@/components/reactbits/LightPillarsBackground';

type MeUsage = {
    plan: 'FREE' | 'PREMIUM' | 'PREMIUM_PLUS' | 'BUSINESS' | 'BUSINESS_PLUS' | string;
    monthlyUsed: number;
    dailyUsed: number;
    email?: string;
};

export default function DashboardPage() {
    const router = useRouter();
    const params = useSearchParams();

    const [me, setMe] = useState<MeUsage | null>(null);
    const [loading, setLoading] = useState(true);

    const shouldOpenUpload = params.get('open') === 'upload';

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) {
            router.replace('/login');
            return;
        }

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

    if (loading) {
        return (
            <div className="min-h-screen grid place-items-center text-white bg-black">
                Loading…
            </div>
        );
    }

    if (!me) return null;

    return (
        <div className="min-h-screen bg-black text-white">
            <Sidebar />

            <main className="md:ml-56">
                {/* Landing-style scene */}
                <div className="relative overflow-hidden min-h-screen">
                    <div className="pointer-events-none absolute inset-0 -z-10">
                        <LightPillarsBackground />
                        {/* soft overlays so pillars don’t overpower UI */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/45" />
                        <div className="absolute inset-0 bg-vignette-strong opacity-100" />
                    </div>

                    <div className="px-4 md:px-6 py-10 max-w-6xl mx-auto relative">
                        <UploadSection plan={me.plan} initialOpenUpload={shouldOpenUpload} />
                    </div>
                </div>
            </main>
        </div>
    );
}
