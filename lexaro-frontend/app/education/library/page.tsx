'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

import Sidebar from '@/components/dashboard/Sidebar';
import api from '@/lib/api';
import LightPillarsBackground from '@/components/reactbits/LightPillarsBackground';
import EducationDocumentCreateModal from '@/components/education/EducationDocumentCreateModal';
import {
    FolderOpen,
    Plus,
    Search,
    FileText,
    BookOpen,
    MessageSquare,
    Layers,
    Clock,
    ChevronRight,
    Sparkles,
    Upload,
    Filter,
} from 'lucide-react';

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
    pages?: number | null;
    uploadedAt: string;
};

/**
 * Format bytes to human readable string.
 */
function fmtBytes(b: number) {
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
    if (b < 1024 * 1024 * 1024) return (b / 1024 / 1024).toFixed(1) + ' MB';
    return (b / 1024 / 1024 / 1024).toFixed(1) + ' GB';
}

/**
 * Get file type icon color based on mime type.
 */
function getMimeColor(mime: string) {
    if (mime.includes('pdf')) return 'text-red-400 bg-red-500/20';
    if (mime.includes('word') || mime.includes('doc')) return 'text-blue-400 bg-blue-500/20';
    if (mime.includes('text')) return 'text-gray-400 bg-gray-500/20';
    if (mime.includes('epub')) return 'text-purple-400 bg-purple-500/20';
    return 'text-white/60 bg-white/10';
}

/**
 * Get short file type label.
 */
function getFileType(mime: string) {
    if (mime.includes('pdf')) return 'PDF';
    if (mime.includes('wordprocessingml') || mime.includes('docx')) return 'DOCX';
    if (mime.includes('msword') || mime.includes('doc')) return 'DOC';
    if (mime.includes('text/plain')) return 'TXT';
    if (mime.includes('epub')) return 'EPUB';
    return 'DOC';
}

/**
 * Education Library Page
 *
 * Displays all education documents with search, filtering, and document cards.
 * Features:
 * - Search by filename
 * - Document cards with type indicators
 * - Quick access to chat, quizzes, flashcards, notes
 * - Empty state with upload CTA
 */
export default function EducationLibraryPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [docs, setDocs] = useState<DocumentResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [openCreate, setOpenCreate] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    /**
     * Load education documents from API.
     */
    async function loadDocs() {
        setLoading(true);
        try {
            const { data } = await api.get<PageResp<DocumentResponse>>('/documents', {
                params: { page: 0, size: 100, sort: 'uploadedAt,DESC', purpose: 'EDUCATION' },
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
        // /education/library?create=1 opens the modal
        if (searchParams.get('create') === '1') {
            setOpenCreate(true);
            router.replace('/education/library');
        }
    }, [searchParams, router]);

    // Filter documents by search query
    const filteredDocs = docs.filter((d) =>
        d.filename.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Calculate stats
    const totalDocs = docs.length;
    const totalPages = docs.reduce((sum, d) => sum + (d.pages || 0), 0);
    const totalSize = docs.reduce((sum, d) => sum + d.sizeBytes, 0);

    return (
        <div className="min-h-screen bg-black text-white">
            <Sidebar />
            <main className="md:ml-56">
                <div className="relative overflow-hidden min-h-screen">
                    {/* Background */}
                    <div className="pointer-events-none absolute inset-0 -z-10">
                        <LightPillarsBackground />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/45" />
                        <div className="absolute inset-0 bg-vignette-strong opacity-100" />
                    </div>

                    <div className="px-4 md:px-6 py-8 max-w-6xl mx-auto">
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35 }}
                            className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 grid place-items-center shadow-lg shadow-purple-500/20">
                                    <FolderOpen className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-2xl font-bold">Education Library</h1>
                                        <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium">
                                            {totalDocs} {totalDocs === 1 ? 'doc' : 'docs'}
                                        </span>
                                    </div>
                                    <p className="text-white/60 text-sm mt-1">
                                        Your documents for AI-powered studying
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setOpenCreate(true)}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500
                                           text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all"
                            >
                                <Plus className="h-4 w-4" />
                                Add Document
                            </button>
                        </motion.div>

                        {/* Stats Row */}
                        {!loading && totalDocs > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35, delay: 0.05 }}
                                className="grid grid-cols-3 gap-4 mb-6"
                            >
                                <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                            <FileText className="h-5 w-5 text-blue-400" />
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold">{totalDocs}</div>
                                            <div className="text-xs text-white/50">Documents</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                            <BookOpen className="h-5 w-5 text-purple-400" />
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold">{totalPages}</div>
                                            <div className="text-xs text-white/50">Total Pages</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                                            <Layers className="h-5 w-5 text-green-400" />
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold">{fmtBytes(totalSize)}</div>
                                            <div className="text-xs text-white/50">Storage Used</div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Search Bar */}
                        {!loading && totalDocs > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35, delay: 0.1 }}
                                className="mb-6"
                            >
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                                    <input
                                        type="text"
                                        placeholder="Search documents..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10
                                                   text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50
                                                   transition-colors"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Loading State */}
                        {loading && (
                            <div className="flex items-center justify-center py-20">
                                <div className="flex items-center gap-3 text-white/60">
                                    <div className="h-5 w-5 border-2 border-white/20 border-t-purple-500 rounded-full animate-spin" />
                                    Loading documents...
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {!loading && docs.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35 }}
                                className="rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 p-12 text-center"
                            >
                                <div className="mx-auto h-20 w-20 rounded-3xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center mb-6">
                                    <Upload className="h-10 w-10 text-purple-400" />
                                </div>
                                <h2 className="text-xl font-semibold mb-2">No documents yet</h2>
                                <p className="text-white/60 mb-6 max-w-md mx-auto">
                                    Upload your study materials and let AI help you create quizzes, flashcards,
                                    notes, and more.
                                </p>
                                <button
                                    onClick={() => setOpenCreate(true)}
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500
                                               text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all"
                                >
                                    <Plus className="h-4 w-4" />
                                    Upload Your First Document
                                </button>
                                <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-white/50">
                                    <span className="flex items-center gap-1">
                                        <MessageSquare className="h-4 w-4" /> AI Chat
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Layers className="h-4 w-4" /> Flashcards
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Sparkles className="h-4 w-4" /> Quizzes
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <BookOpen className="h-4 w-4" /> Smart Notes
                                    </span>
                                </div>
                            </motion.div>
                        )}

                        {/* No Search Results */}
                        {!loading && docs.length > 0 && filteredDocs.length === 0 && (
                            <div className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center">
                                <Search className="h-10 w-10 text-white/30 mx-auto mb-4" />
                                <h3 className="font-semibold mb-2">No matching documents</h3>
                                <p className="text-white/60 text-sm">
                                    Try a different search term or{' '}
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="text-purple-400 hover:underline"
                                    >
                                        clear the search
                                    </button>
                                </p>
                            </div>
                        )}

                        {/* Document Grid */}
                        {!loading && filteredDocs.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35, delay: 0.15 }}
                                className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
                            >
                                {filteredDocs.map((doc, idx) => {
                                    const colorClass = getMimeColor(doc.mime);
                                    const fileType = getFileType(doc.mime);
                                    const uploadDate = new Date(doc.uploadedAt);
                                    const isRecent = Date.now() - uploadDate.getTime() < 24 * 60 * 60 * 1000;

                                    return (
                                        <motion.div
                                            key={doc.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.25, delay: Math.min(0.3, idx * 0.03) }}
                                        >
                                            <Link
                                                href={`/education/doc/${doc.id}`}
                                                className="group block rounded-2xl bg-white/5 border border-white/10 p-5
                                                           hover:bg-white/[0.08] hover:border-purple-500/30 transition-all"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className={`h-12 w-12 rounded-xl ${colorClass} flex items-center justify-center flex-shrink-0`}>
                                                        <FileText className="h-6 w-6" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-semibold truncate group-hover:text-purple-400 transition-colors">
                                                                {doc.filename}
                                                            </h3>
                                                            {isRecent && (
                                                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-500/20 text-green-400 font-medium">
                                                                    NEW
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                                            <span className="px-2 py-0.5 rounded-md bg-white/10 text-xs text-white/70">
                                                                {fileType}
                                                            </span>
                                                            {doc.pages && (
                                                                <span className="text-xs text-white/50">
                                                                    {doc.pages} {doc.pages === 1 ? 'page' : 'pages'}
                                                                </span>
                                                            )}
                                                            <span className="text-xs text-white/40">
                                                                {fmtBytes(doc.sizeBytes)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="h-5 w-5 text-white/30 group-hover:text-purple-400 transition-colors" />
                                                </div>

                                                {/* Quick Actions Preview */}
                                                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                                                    <div className="flex items-center gap-1 text-xs text-white/40">
                                                        <Clock className="h-3 w-3" />
                                                        {uploadDate.toLocaleDateString()}
                                                    </div>
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <span className="px-2 py-1 rounded-md bg-blue-500/20 text-blue-400 text-[10px] font-medium">
                                                            Chat
                                                        </span>
                                                        <span className="px-2 py-1 rounded-md bg-green-500/20 text-green-400 text-[10px] font-medium">
                                                            Quiz
                                                        </span>
                                                        <span className="px-2 py-1 rounded-md bg-purple-500/20 text-purple-400 text-[10px] font-medium">
                                                            Cards
                                                        </span>
                                                    </div>
                                                </div>
                                            </Link>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
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
