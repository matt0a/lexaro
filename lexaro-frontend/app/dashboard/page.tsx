'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import Sidebar from '@/components/dashboard/Sidebar';
import UploadSection from '@/components/upload/UploadSection';
import api from '@/lib/api';
import { useMeUsage } from '@/hooks/useMeUsage';
import { queryKeys } from '@/lib/queryKeys';

// Landing background
import LightPillarsBackground from '@/components/reactbits/LightPillarsBackground';

export default function DashboardPage() {
    const router = useRouter();
    const params = useSearchParams();
    const queryClient = useQueryClient();

    const { data: me, isLoading } = useMeUsage();

    // Prevent double-running sync in React 18 Strict Mode dev
    const hasHandledStripeReturn = useRef(false);

    const shouldOpenUpload = params.get('open') === 'upload';

    /**
     * Auth guard — redirect to login if no token is present.
     * Also handles the Stripe return flow (checkout=success|cancel + session_id).
     * The /me/usage data fetch is now handled by useMeUsage() above.
     */
    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) {
            router.replace('/login');
            return;
        }

        const checkout = params.get('checkout');
        const sessionId = params.get('session_id');

        if (!hasHandledStripeReturn.current && checkout && (checkout === 'success' || checkout === 'cancel')) {
            hasHandledStripeReturn.current = true;

            (async () => {
                if (checkout === 'success' && sessionId) {
                    try {
                        await api.post('/billing/sync', { sessionId });
                        // Invalidate usage cache so Sidebar + any usage display refreshes
                        await queryClient.invalidateQueries({ queryKey: queryKeys.meUsage() });
                    } finally {
                        // Clean URL so a refresh does not re-trigger sync
                        router.replace('/dashboard');
                    }
                } else {
                    // cancel case
                    router.replace('/dashboard');
                }
            })();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router, params]);

    if (isLoading) {
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
                        {/* soft overlays so pillars don't overpower UI */}
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
