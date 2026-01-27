'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import LightPillarsBackground from '@/components/reactbits/LightPillarsBackground';
import { MessageSquare } from 'lucide-react';

/**
 * Global AI Tutor page - chat without document context.
 * Full implementation in Milestone 1 (Chat).
 */
export default function GlobalAiTutorPage() {
    const router = useRouter();

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) router.replace('/login');
    }, [router]);

    return (
        <div className="min-h-screen bg-black text-white">
            <Sidebar />
            <main className="md:ml-56">
                <div className="relative overflow-hidden min-h-screen">
                    <div className="pointer-events-none absolute inset-0 -z-10">
                        <LightPillarsBackground />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/45" />
                        <div className="absolute inset-0 bg-vignette-strong opacity-100" />
                    </div>

                    <div className="px-4 md:px-6 py-10 max-w-4xl mx-auto">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-12 w-12 rounded-2xl border border-white/10 bg-white/5 grid place-items-center">
                                <MessageSquare className="h-6 w-6 text-[#009FFD]" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-semibold">AI Tutor</h1>
                                <p className="text-white/60 text-sm">Ask questions about any topic</p>
                            </div>
                        </div>

                        <div className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center">
                            <div className="text-white/70">
                                Chat interface coming soon. For document-grounded chat, open a document from{' '}
                                <a href="/education/library" className="text-[#009FFD] hover:underline">
                                    Education Library
                                </a>{' '}
                                and use the Chat tab.
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
