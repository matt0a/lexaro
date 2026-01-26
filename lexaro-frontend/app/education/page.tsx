'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import LightPillarsBackground from '@/components/reactbits/LightPillarsBackground';

export default function EducationHomePage() {
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

                    <div className="px-4 md:px-6 py-10 max-w-6xl mx-auto">
                        <div className="flex items-start justify-between gap-6">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-semibold">Education</h1>
                                <p className="text-white/70 mt-2 max-w-2xl">
                                    Your document-grounded study workflow. Index a document, search chunks, then we’ll plug this into Chat/Notes/Quizzes next.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <Link
                                    href="/education/library"
                                    className="px-4 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 transition"
                                >
                                    Open Library
                                </Link>
                                <Link
                                    href="/dashboard?open=upload"
                                    className="px-4 py-2 rounded-xl bg-[#009FFD] text-black font-semibold hover:opacity-90 transition"
                                >
                                    Upload Document
                                </Link>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 mt-8">
                            <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                                <div className="text-sm text-white/60">Step 1</div>
                                <div className="mt-1 font-semibold">Index your document</div>
                                <div className="mt-2 text-sm text-white/70">
                                    We chunk extracted text into page-ranged chunks for retrieval.
                                </div>
                            </div>

                            <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                                <div className="text-sm text-white/60">Step 2</div>
                                <div className="mt-1 font-semibold">Search chunks</div>
                                <div className="mt-2 text-sm text-white/70">
                                    Keyword scoring for MVP. Later we’ll add embeddings.
                                </div>
                            </div>

                            <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                                <div className="text-sm text-white/60">Step 3</div>
                                <div className="mt-1 font-semibold">Use in AI features</div>
                                <div className="mt-2 text-sm text-white/70">
                                    Chat/Notes/Quizzes will cite sources from these chunks.
                                </div>
                            </div>
                        </div>

                        <div className="mt-8">
                            <Link href="/education/library" className="inline-flex items-center gap-2 text-[#2AFC98] hover:opacity-90">
                                Go to Library →
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
