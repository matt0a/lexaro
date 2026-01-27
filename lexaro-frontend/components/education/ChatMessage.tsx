'use client';

import { ChatSource } from '@/lib/educationApi';

/**
 * Props for the ChatMessage component.
 * role: 'user' | 'assistant' - determines styling and alignment
 * content: the message text, may contain [chunk:N] citation markers
 * sources: optional array of source citations for assistant messages
 * onCitationClick: callback when a citation link is clicked
 */
type ChatMessageProps = {
    role: 'user' | 'assistant';
    content: string;
    sources?: ChatSource[];
    onCitationClick?: (source: ChatSource) => void;
};

/**
 * Renders a single chat message with citation support.
 * User messages appear on the right with blue background.
 * Assistant messages appear on the left with dark background and clickable citations.
 */
export default function ChatMessage({
    role,
    content,
    sources = [],
    onCitationClick,
}: ChatMessageProps) {
    const isUser = role === 'user';

    /**
     * Parses the content and replaces [chunk:N] markers with clickable links.
     * Returns an array of React nodes (strings and citation buttons).
     */
    const renderContent = () => {
        // Match citation patterns like [chunk:0], [chunk:1], etc.
        const citationRegex = /\[chunk:(\d+)\]/g;
        const parts: React.ReactNode[] = [];
        let lastIndex = 0;
        let match;

        while ((match = citationRegex.exec(content)) !== null) {
            // Add text before the citation
            if (match.index > lastIndex) {
                parts.push(content.slice(lastIndex, match.index));
            }

            const chunkIndex = parseInt(match[1], 10);
            // Find the source that matches this chunk index
            const source = sources.find((s) => s.chunkIndex === chunkIndex);

            if (source && onCitationClick) {
                // Render clickable citation link
                parts.push(
                    <button
                        key={`citation-${match.index}`}
                        onClick={() => onCitationClick(source)}
                        className="inline-flex items-center px-1.5 py-0.5 mx-0.5 text-xs font-medium
                                   bg-[#009FFD]/20 text-[#009FFD] rounded hover:bg-[#009FFD]/30
                                   transition-colors cursor-pointer"
                        title={`Page ${source.pageStart}${source.pageEnd && source.pageEnd !== source.pageStart ? `-${source.pageEnd}` : ''}`}
                    >
                        <svg
                            className="w-3 h-3 mr-1"
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
                        p.{source.pageStart}
                        {source.pageEnd && source.pageEnd !== source.pageStart && `-${source.pageEnd}`}
                    </button>
                );
            } else {
                // Fallback: render as plain text if source not found
                parts.push(
                    <span
                        key={`citation-${match.index}`}
                        className="inline-flex items-center px-1.5 py-0.5 mx-0.5 text-xs
                                   bg-white/10 text-white/60 rounded"
                    >
                        [source]
                    </span>
                );
            }

            lastIndex = match.index + match[0].length;
        }

        // Add remaining text after the last citation
        if (lastIndex < content.length) {
            parts.push(content.slice(lastIndex));
        }

        return parts.length > 0 ? parts : content;
    };

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
            <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    isUser
                        ? 'bg-[#009FFD] text-black'
                        : 'bg-white/5 border border-white/10 text-white'
                }`}
            >
                {/* Role indicator for assistant */}
                {!isUser && (
                    <div className="flex items-center gap-2 mb-2 text-xs text-white/50">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                        </svg>
                        <span>Lexaro</span>
                    </div>
                )}

                {/* Message content with parsed citations */}
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {renderContent()}
                </div>

                {/* Show sources count for assistant messages */}
                {!isUser && sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/10 text-xs text-white/40">
                        {sources.length} source{sources.length !== 1 ? 's' : ''} cited
                    </div>
                )}
            </div>
        </div>
    );
}
