'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import Sidebar from '@/components/dashboard/Sidebar';
import api from '@/lib/api';
import LightPillarsBackground from '@/components/reactbits/LightPillarsBackground';
import EducationDocumentCreateModal from '@/components/education/EducationDocumentCreateModal';

type PageResp<T> = {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
};

type DocumentResponse = {
    id: number;
    filename: string;
    mime: string;
    sizeBytes: number;
    uploadedAt: string;
};

export default function EducationLibraryPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [docs, setDocs] = useState<DocumentResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [openCreate, setOpenCreate] = useState(false);

    async function loadDocs() {
        setLoading(true);
        try {
            const { data } = await api.get<PageResp<DocumentResponse>>('/documents', {
                params: { page: 0, size: 50, sort: 'uploadedAt,DESC', purpose: 'EDUCATION' },
            });
            setDocs(data.content || []);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) {
            router.replace('/login');
            return;
        }

        loadDocs();
    }, [router]);

    useEffect(() => {
        // Optional: /education/library?create=1 opens the modal
        if (searchParams.get('create') === '1') {
            setOpenCreate(true);
            router.replace('/education/library');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

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
                                <h1 className="text-3xl font-semibold">Education Library</h1>
                                <p className="text-white/70 mt-2">Documents uploaded for Education.</p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setOpenCreate(true)}
                                className="px-4 py-2 rounded-xl bg-[#009FFD] text-black font-semibold hover:opacity-90 transition"
                            >
                                Add Document
                            </button>
                        </div>

                        {loading ? (
                            <div className="mt-8 text-white/70">Loading…</div>
                        ) : docs.length === 0 ? (
                            <div className="mt-8 rounded-2xl bg-white/5 border border-white/10 p-6 text-white/70">
                                No Education documents yet. Click <span className="text-white">Add Document</span>.
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-4 mt-8">
                                {docs.map((d) => (
                                    <Link
                                        key={d.id}
                                        href={`/education/doc/${d.id}`}
                                        className="rounded-2xl bg-white/5 border border-white/10 p-5 hover:bg-white/10 transition"
                                    >
                                        <div className="font-semibold">{d.filename}</div>
                                        <div className="text-sm text-white/60 mt-1">{d.mime}</div>
                                        <div className="text-xs text-white/50 mt-2">
                                            Uploaded: {new Date(d.uploadedAt).toLocaleString()}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <EducationDocumentCreateModal
                        open={openCreate}
                        onClose={() => setOpenCreate(false)}
                        onCreated={(id) => {
                            loadDocs();
                            router.push(`/education/doc/${id}`);
                        }}
                    />
                </div>
            </main>
        </div>
    );
}
