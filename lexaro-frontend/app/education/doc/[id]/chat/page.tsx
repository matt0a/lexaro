'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ChatMessage from '@/components/education/ChatMessage';
import CitationPanel from '@/components/education/CitationPanel';
import {
    sendChatMessage,
    indexEducationDocument,
    ChatMessage as ChatMessageType,
    ChatSource,
    ChatResponse,
} from '@/lib/educationApi';

/**
 * Education Document Chat Page
 *
 * Provides an AI-powered chat interface grounded in the document content.
 * Features:
 * - Message input with send button
 * - Auto-scrolling message list
 * - Citation markers that open a detail panel
 * - Loading states and error handling
 * - Automatic document indexing if needed
 */
export default function EducationDocChatPage() {
    const params = useParams();
    const docId = Number(params.id);

    // Chat state
    const [messages, setMessages] = useState<Array<ChatMessageType & { sources?: ChatSource[] }>>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Citation panel state
    const [selectedSource, setSelectedSource] = useState<ChatSource | null>(null);

    // Indexing state
    const [isIndexing, setIsIndexing] = useState(false);
    const [indexError, setIndexError] = useState<string | null>(null);

    // Ref for auto-scrolling
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    /**
     * Ensures the document is indexed before sending chat messages.
     * Called automatically on first message if needed.
     */
    const ensureIndexed = async () => {
        setIsIndexing(true);
        setIndexError(null);
        try {
            await indexEducationDocument(docId);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to index document';
            // Check if it's a "already indexed" or "no text" error
            if (errorMessage.includes('no extracted text')) {
                setIndexError('Document has no extracted text. Please ensure the document was processed successfully.');
                throw err;
            }
            // Ignore other errors - document might already be indexed
            console.warn('Index warning:', errorMessage);
        } finally {
            setIsIndexing(false);
        }
    };

    /**
     * Sends a message to the AI tutor and handles the response.
     */
    const handleSend = async () => {
        const trimmedInput = inputValue.trim();
        if (!trimmedInput || isLoading) return;

        // Clear input immediately
        setInputValue('');
        setError(null);

        // Add user message to chat
        const userMessage: ChatMessageType = { role: 'user', content: trimmedInput };
        setMessages((prev) => [...prev, userMessage]);

        setIsLoading(true);

        try {
            // Try to index first (will be a no-op if already indexed)
            await ensureIndexed();

            // Build history from existing messages (exclude sources)
            const history: ChatMessageType[] = messages.map((m) => ({
                role: m.role,
                content: m.content,
            }));

            // Send to backend
            const response: ChatResponse = await sendChatMessage({
                message: trimmedInput,
                docId,
                history,
            });

            // Add assistant message with sources
            const assistantMessage: ChatMessageType & { sources?: ChatSource[] } = {
                role: 'assistant',
                content: response.answer,
                sources: response.sources,
            };
            setMessages((prev) => [...prev, assistantMessage]);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
            setError(errorMessage);
            // Remove the user message on error
            setMessages((prev) => prev.slice(0, -1));
            setInputValue(trimmedInput); // Restore input
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Handles Enter key press to send message.
     */
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-280px)] min-h-[400px]">
            {/* Index error banner */}
            {indexError && (
                <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                    {indexError}
                </div>
            )}

            {/* Messages container */}
            <div className="flex-1 overflow-y-auto rounded-2xl bg-white/5 border border-white/10 p-4 mb-4">
                {messages.length === 0 ? (
                    // Empty state
                    <div className="h-full flex flex-col items-center justify-center text-center px-4">
                        <div className="w-16 h-16 rounded-2xl bg-[#009FFD]/20 flex items-center justify-center mb-4">
                            <svg
                                className="w-8 h-8 text-[#009FFD]"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-white font-semibold text-lg mb-2">
                            Start a conversation
                        </h3>
                        <p className="text-white/50 text-sm max-w-sm">
                            Ask questions about this document. The AI will use the document
                            content to provide grounded answers with page citations.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-2 justify-center">
                            {['Summarize this document', 'What are the key points?', 'Explain the main concepts'].map(
                                (suggestion) => (
                                    <button
                                        key={suggestion}
                                        onClick={() => setInputValue(suggestion)}
                                        className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10
                                                   text-white/70 text-xs hover:bg-white/10 transition-colors"
                                    >
                                        {suggestion}
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                ) : (
                    // Message list
                    <div className="space-y-2">
                        {messages.map((msg, idx) => (
                            <ChatMessage
                                key={idx}
                                role={msg.role}
                                content={msg.content}
                                sources={msg.sources}
                                onCitationClick={setSelectedSource}
                            />
                        ))}

                        {/* Loading indicator */}
                        {isLoading && (
                            <div className="flex justify-start mb-4">
                                <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                                    <div className="flex items-center gap-2 text-white/50">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-[#009FFD] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-2 h-2 bg-[#009FFD] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="w-2 h-2 bg-[#009FFD] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                        <span className="text-sm">
                                            {isIndexing ? 'Indexing document...' : 'Thinking...'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Scroll anchor */}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Error message */}
            {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                        />
                    </svg>
                    <span>{error}</span>
                    <button
                        onClick={() => setError(null)}
                        className="ml-auto text-red-400 hover:text-red-300"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Input area */}
            <div className="rounded-2xl bg-white/5 border border-white/10 p-3 flex gap-3">
                <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a question about this document..."
                    disabled={isLoading}
                    rows={1}
                    className="flex-1 bg-transparent text-white placeholder-white/30 resize-none
                               focus:outline-none disabled:opacity-50 text-sm py-2"
                    style={{ minHeight: '40px', maxHeight: '120px' }}
                />
                <button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isLoading}
                    className="px-4 py-2 rounded-xl bg-[#009FFD] text-black font-semibold text-sm
                               hover:bg-[#009FFD]/90 disabled:opacity-50 disabled:cursor-not-allowed
                               transition-colors flex items-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                />
                            </svg>
                            Sending
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                />
                            </svg>
                            Send
                        </>
                    )}
                </button>
            </div>

            {/* Keyboard hint */}
            <div className="mt-2 text-center text-xs text-white/30">
                Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded">Enter</kbd> to send,{' '}
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded">Shift+Enter</kbd> for new line
            </div>

            {/* Citation panel */}
            <CitationPanel source={selectedSource} onClose={() => setSelectedSource(null)} />
        </div>
    );
}
