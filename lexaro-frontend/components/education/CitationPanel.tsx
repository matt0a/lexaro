'use client';

import { ChatSource } from '@/lib/educationApi';

/**
 * Props for the CitationPanel component.
 * source: the selected source citation to display
 * onClose: callback to close the panel
 */
type CitationPanelProps = {
    source: ChatSource | null;
    onClose: () => void;
};

/**
 * Displays detailed information about a selected source citation.
 * Shows the page range, snippet text, and relevance score.
 * Renders as a slide-out panel on the right side.
 */
export default function CitationPanel({ source, onClose }: CitationPanelProps) {
    if (!source) return null;

    const pageRange =
        source.pageStart && source.pageEnd && source.pageStart !== source.pageEnd
            ? `${source.pageStart}-${source.pageEnd}`
            : source.pageStart?.toString() ?? 'Unknown';

    return (
        <div className="fixed inset-y-0 right-0 w-96 max-w-full bg-black/95 border-l border-white/10 shadow-2xl z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <svg
                        className="w-5 h-5 text-[#009FFD]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                    <h3 className="text-white font-semibold">Source Citation</h3>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                    aria-label="Close panel"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Page info */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#009FFD]/20 flex items-center justify-center">
                            <span className="text-[#009FFD] font-bold text-sm">{pageRange}</span>
                        </div>
                        <div>
                            <div className="text-white font-medium">Page {pageRange}</div>
                            <div className="text-white/50 text-sm">
                                Chunk #{source.chunkIndex}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Relevance score */}
                {source.score !== null && source.score !== undefined && (
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-white/50">Relevance:</span>
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[#009FFD] rounded-full transition-all"
                                style={{ width: `${Math.min(100, source.score * 10)}%` }}
                            />
                        </div>
                        <span className="text-white/70 font-medium">
                            {source.score.toFixed(1)}
                        </span>
                    </div>
                )}

                {/* Snippet */}
                <div>
                    <h4 className="text-white/50 text-xs uppercase tracking-wider mb-2">
                        Excerpt from document
                    </h4>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">
                            {source.snippet}
                        </p>
                    </div>
                </div>

                {/* Character position info */}
                {source.startChar !== null && source.startChar !== undefined && (
                    <div className="text-xs text-white/30">
                        Character range: {source.startChar?.toLocaleString()} -{' '}
                        {source.endChar?.toLocaleString()}
                    </div>
                )}
            </div>

            {/* Footer hint */}
            <div className="p-4 border-t border-white/10 text-center text-xs text-white/40">
                This excerpt was used to ground the AI response
            </div>
        </div>
    );
}
