'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
    Note,
    NoteStyle,
    generateNotes,
    getNotesForDocument,
    deleteNote
} from '@/lib/educationApi';

type ViewMode = 'list' | 'generate' | 'view';

/**
 * Style metadata for display and selection.
 */
const STYLE_OPTIONS: { value: NoteStyle; label: string; description: string; icon: string }[] = [
    {
        value: 'outline',
        label: 'Outline',
        description: 'Hierarchical bullet points with key topics',
        icon: '📋'
    },
    {
        value: 'cornell',
        label: 'Cornell Method',
        description: 'Cue column, notes, and summary sections',
        icon: '📐'
    },
    {
        value: 'detailed',
        label: 'Detailed',
        description: 'Comprehensive notes with explanations and examples',
        icon: '📖'
    },
    {
        value: 'summary',
        label: 'Summary',
        description: 'Concise executive summary with key points',
        icon: '📝'
    }
];

export default function EducationDocNotesPage() {
    const params = useParams();
    const docId = Number(params.id);

    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [currentNote, setCurrentNote] = useState<Note | null>(null);

    // Generation options
    const [selectedStyle, setSelectedStyle] = useState<NoteStyle>('outline');

    // Load notes on mount
    useEffect(() => {
        loadNotes();
    }, [docId]);

    async function loadNotes() {
        setLoading(true);
        setError(null);
        try {
            const data = await getNotesForDocument(docId);
            setNotes(data);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to load notes');
        } finally {
            setLoading(false);
        }
    }

    async function handleGenerate() {
        setGenerating(true);
        setError(null);
        try {
            const note = await generateNotes(docId, { style: selectedStyle });
            setNotes(prev => [note, ...prev]);
            setCurrentNote(note);
            setViewMode('view');
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to generate notes');
        } finally {
            setGenerating(false);
        }
    }

    async function handleDelete(noteId: number) {
        if (!confirm('Are you sure you want to delete these notes?')) return;
        try {
            await deleteNote(noteId);
            setNotes(prev => prev.filter(n => n.id !== noteId));
            if (currentNote?.id === noteId) {
                setCurrentNote(null);
                setViewMode('list');
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to delete notes');
        }
    }

    function viewNote(note: Note) {
        setCurrentNote(note);
        setViewMode('view');
    }

    function copyToClipboard(text: string) {
        navigator.clipboard.writeText(text);
    }

    // Get style label from value
    function getStyleLabel(style: string): string {
        return STYLE_OPTIONS.find(s => s.value === style)?.label || style;
    }

    // Get style icon from value
    function getStyleIcon(style: string): string {
        return STYLE_OPTIONS.find(s => s.value === style)?.icon || '📝';
    }

    // Render based on view mode
    if (viewMode === 'generate') {
        return (
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Generate New Notes</h2>

                <div className="mb-6">
                    <label className="block text-white/70 text-sm mb-3">Select Note Style</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {STYLE_OPTIONS.map(style => (
                            <button
                                key={style.value}
                                onClick={() => setSelectedStyle(style.value)}
                                className={`p-4 rounded-xl text-left transition border ${
                                    selectedStyle === style.value
                                        ? 'bg-purple-600/30 border-purple-500/50'
                                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                                }`}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-2xl">{style.icon}</span>
                                    <span className="text-white font-medium">{style.label}</span>
                                </div>
                                <p className="text-white/50 text-sm">{style.description}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-300 text-sm">
                        {error}
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="px-6 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        {generating ? 'Generating...' : 'Generate Notes'}
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className="px-6 py-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    if (viewMode === 'view' && currentNote) {
        return (
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">{getStyleIcon(currentNote.style)}</span>
                            <span className="text-white/50 text-sm">
                                {getStyleLabel(currentNote.style)}
                            </span>
                        </div>
                        <h2 className="text-xl font-semibold text-white">{currentNote.title}</h2>
                        <p className="text-white/50 text-sm mt-1">
                            Generated on {new Date(currentNote.createdAt).toLocaleDateString()}
                            {currentNote.pageStart && currentNote.pageEnd &&
                                ` • Pages ${currentNote.pageStart}-${currentNote.pageEnd}`
                            }
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => copyToClipboard(currentNote.content)}
                            className="px-3 py-2 rounded-lg bg-white/10 text-white/70 text-sm hover:bg-white/20 transition"
                            title="Copy to clipboard"
                        >
                            Copy
                        </button>
                        <button
                            onClick={() => handleDelete(currentNote.id)}
                            className="px-3 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition"
                        >
                            Delete
                        </button>
                    </div>
                </div>

                {/* Note content - rendered as markdown-like */}
                <div className="bg-white/5 rounded-xl p-6 mb-6 max-h-[60vh] overflow-y-auto">
                    <NoteContent content={currentNote.content} />
                </div>

                <button
                    onClick={() => {
                        setViewMode('list');
                        setCurrentNote(null);
                    }}
                    className="px-6 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-500 transition"
                >
                    Back to Notes
                </button>
            </div>
        );
    }

    // Default: list view
    return (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">Notes</h2>
                <button
                    onClick={() => setViewMode('generate')}
                    className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-500 transition"
                >
                    + Generate Notes
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-300 text-sm">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="text-white/50 text-center py-8">Loading notes...</div>
            ) : notes.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-white/30 text-4xl mb-4">📝</div>
                    <p className="text-white/70 mb-4">No notes yet</p>
                    <p className="text-white/50 text-sm mb-6">
                        Generate AI-powered notes in various styles to help you study.
                    </p>
                    <button
                        onClick={() => setViewMode('generate')}
                        className="px-6 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-500 transition"
                    >
                        Generate Your First Notes
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {notes.map(note => (
                        <div
                            key={note.id}
                            className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition"
                        >
                            <div className="flex items-center gap-4">
                                <span className="text-2xl">{getStyleIcon(note.style)}</span>
                                <div>
                                    <h3 className="text-white font-medium">{note.title}</h3>
                                    <p className="text-white/50 text-sm">
                                        {getStyleLabel(note.style)} • {new Date(note.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => viewNote(note)}
                                    className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-500 transition"
                                >
                                    View
                                </button>
                                <button
                                    onClick={() => handleDelete(note.id)}
                                    className="px-3 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/**
 * Component to render note content with basic markdown-like formatting.
 * Supports headers, bullets, bold, and line breaks.
 */
function NoteContent({ content }: { content: string }) {
    // Split by lines and render each
    const lines = content.split('\n');

    return (
        <div className="prose prose-invert prose-sm max-w-none">
            {lines.map((line, idx) => {
                const trimmed = line.trim();

                // Empty line
                if (!trimmed) {
                    return <div key={idx} className="h-3" />;
                }

                // H2 header (##)
                if (trimmed.startsWith('## ')) {
                    return (
                        <h2 key={idx} className="text-lg font-semibold text-white mt-4 mb-2">
                            {trimmed.slice(3)}
                        </h2>
                    );
                }

                // H3 header (###)
                if (trimmed.startsWith('### ')) {
                    return (
                        <h3 key={idx} className="text-md font-semibold text-white/90 mt-3 mb-1">
                            {trimmed.slice(4)}
                        </h3>
                    );
                }

                // H1 header (#)
                if (trimmed.startsWith('# ')) {
                    return (
                        <h1 key={idx} className="text-xl font-bold text-white mt-4 mb-3">
                            {trimmed.slice(2)}
                        </h1>
                    );
                }

                // Bullet point (- or *)
                if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                    const indent = line.search(/\S/);
                    const marginLeft = Math.min(indent / 2, 4) * 16;
                    return (
                        <div key={idx} className="flex items-start gap-2 text-white/80" style={{ marginLeft }}>
                            <span className="text-purple-400 mt-0.5">•</span>
                            <span>{formatInlineMarkdown(trimmed.slice(2))}</span>
                        </div>
                    );
                }

                // Numbered list
                const numberedMatch = trimmed.match(/^(\d+)\.\s/);
                if (numberedMatch) {
                    const indent = line.search(/\S/);
                    const marginLeft = Math.min(indent / 2, 4) * 16;
                    return (
                        <div key={idx} className="flex items-start gap-2 text-white/80" style={{ marginLeft }}>
                            <span className="text-purple-400 min-w-[1.5rem]">{numberedMatch[1]}.</span>
                            <span>{formatInlineMarkdown(trimmed.slice(numberedMatch[0].length))}</span>
                        </div>
                    );
                }

                // Regular paragraph
                return (
                    <p key={idx} className="text-white/80 mb-2">
                        {formatInlineMarkdown(trimmed)}
                    </p>
                );
            })}
        </div>
    );
}

/**
 * Format inline markdown (bold, italic).
 */
function formatInlineMarkdown(text: string): React.ReactNode {
    // Simple bold handling (**text**)
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
        }
        return part;
    });
}
