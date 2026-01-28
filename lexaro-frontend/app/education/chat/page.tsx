'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import LightPillarsBackground from '@/components/reactbits/LightPillarsBackground';
import ChatMessage from '@/components/education/ChatMessage';
import CitationPanel from '@/components/education/CitationPanel';
import { getEducationDocuments, EducationDocument } from '@/lib/documents';
import {
    sendChatMessage,
    indexEducationDocument,
    ChatMessage as ChatMessageType,
    ChatSource,
    ChatResponse,
} from '@/lib/educationApi';
import {
    MessageSquare,
    Send,
    Loader2,
    BookOpen,
    Sparkles,
    FileText,
    ChevronDown,
    X,
    Lightbulb,
    GraduationCap,
    Brain,
} from 'lucide-react';

/**
 * Global AI Tutor Page
 *
 * Provides an AI-powered tutoring chat interface that can:
 * - Answer general educational questions without document context
 * - Optionally use a selected document for grounded, cited answers
 * - Maintain conversation history within the session
 * - Display source citations when documents are used
 */
export default function GlobalAiTutorPage() {
    const router = useRouter();

    // Auth check
    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) router.replace('/login');
    }, [router]);

    // Document selection state
    const [documents, setDocuments] = useState<EducationDocument[]>([]);
    const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
    const [isDocSelectorOpen, setIsDocSelectorOpen] = useState(false);
    const [loadingDocs, setLoadingDocs] = useState(true);

    // Chat state
    const [messages, setMessages] = useState<Array<ChatMessageType & { sources?: ChatSource[] }>>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Citation panel state
    const [selectedSource, setSelectedSource] = useState<ChatSource | null>(null);

    // Indexing state
    const [isIndexing, setIsIndexing] = useState(false);

    // Ref for auto-scrolling
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const docSelectorRef = useRef<HTMLDivElement>(null);

    // Fetch education documents on mount
    useEffect(() => {
        const fetchDocs = async () => {
            try {
                const docs = await getEducationDocuments();
                setDocuments(docs);
            } catch (err) {
                console.error('Failed to fetch documents:', err);
            } finally {
                setLoadingDocs(false);
            }
        };
        fetchDocs();
    }, []);

    // Auto-scroll when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Close doc selector when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (docSelectorRef.current && !docSelectorRef.current.contains(e.target as Node)) {
                setIsDocSelectorOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    /**
     * Ensures the selected document is indexed before sending chat messages.
     */
    const ensureIndexed = async (docId: number) => {
        setIsIndexing(true);
        try {
            await indexEducationDocument(docId);
        } catch (err: unknown) {
            // Ignore errors - document might already be indexed
            console.warn('Index warning:', err);
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
            // Index document if selected
            if (selectedDocId) {
                await ensureIndexed(selectedDocId);
            }

            // Build history from existing messages (exclude sources)
            const history: ChatMessageType[] = messages.map((m) => ({
                role: m.role,
                content: m.content,
            }));

            // Send to backend
            const response: ChatResponse = await sendChatMessage({
                message: trimmedInput,
                docId: selectedDocId,
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

    /**
     * Clear conversation and start fresh.
     */
    const handleClearChat = () => {
        setMessages([]);
        setError(null);
    };

    /**
     * Get the selected document object.
     */
    const selectedDoc = documents.find((d) => d.id === selectedDocId);

    /**
     * Quick suggestions based on context.
     */
    const suggestions = selectedDocId
        ? [
              'Summarize the key points',
              'Explain the main concepts',
              'Create a quiz question',
              'What should I focus on?',
          ]
        : [
              'Explain photosynthesis simply',
              'Help me understand calculus',
              'What is machine learning?',
              'How do I write a thesis statement?',
          ];

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

                    <div className="px-4 md:px-6 py-8 max-w-4xl mx-auto h-screen flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 grid place-items-center shadow-lg shadow-blue-500/20">
                                    <GraduationCap className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold">AI Tutor</h1>
                                    <p className="text-white/60 text-sm">
                                        {selectedDoc
                                            ? `Chatting about: ${selectedDoc.filename}`
                                            : 'Ask me anything about any topic'}
                                    </p>
                                </div>
                            </div>

                            {/* Clear chat button - only show when there are messages */}
                            {messages.length > 0 && (
                                <button
                                    onClick={handleClearChat}
                                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10
                                               text-white/60 hover:text-white text-sm transition-colors
                                               flex items-center gap-2"
                                >
                                    <X className="h-4 w-4" />
                                    Clear
                                </button>
                            )}
                        </div>

                        {/* Document Selector */}
                        <div className="mb-4" ref={docSelectorRef}>
                            <div className="relative">
                                <button
                                    onClick={() => setIsDocSelectorOpen(!isDocSelectorOpen)}
                                    className="w-full md:w-auto flex items-center gap-3 px-4 py-3 rounded-xl
                                               bg-white/5 border border-white/10 hover:border-white/20
                                               transition-colors text-left"
                                >
                                    <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                        <FileText className="h-4 w-4 text-purple-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-white/50 mb-0.5">Document Context</div>
                                        <div className="text-sm text-white truncate">
                                            {loadingDocs
                                                ? 'Loading...'
                                                : selectedDoc
                                                ? selectedDoc.filename
                                                : 'No document selected (general mode)'}
                                        </div>
                                    </div>
                                    <ChevronDown
                                        className={`h-4 w-4 text-white/40 transition-transform ${
                                            isDocSelectorOpen ? 'rotate-180' : ''
                                        }`}
                                    />
                                </button>

                                {/* Dropdown */}
                                {isDocSelectorOpen && (
                                    <div className="absolute z-20 mt-2 w-full md:w-96 rounded-xl bg-gray-900 border border-white/10 shadow-xl overflow-hidden">
                                        {/* General mode option */}
                                        <button
                                            onClick={() => {
                                                setSelectedDocId(null);
                                                setIsDocSelectorOpen(false);
                                            }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors ${
                                                !selectedDocId ? 'bg-blue-500/10' : ''
                                            }`}
                                        >
                                            <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                                <Brain className="h-4 w-4 text-blue-400" />
                                            </div>
                                            <div className="text-left">
                                                <div className="text-sm text-white">General Mode</div>
                                                <div className="text-xs text-white/50">
                                                    Ask about any topic
                                                </div>
                                            </div>
                                            {!selectedDocId && (
                                                <div className="ml-auto h-2 w-2 rounded-full bg-blue-500" />
                                            )}
                                        </button>

                                        <div className="border-t border-white/10" />

                                        {/* Document list */}
                                        <div className="max-h-60 overflow-y-auto">
                                            {documents.length === 0 ? (
                                                <div className="px-4 py-6 text-center text-white/50 text-sm">
                                                    No education documents yet.
                                                    <a
                                                        href="/education/library"
                                                        className="block mt-1 text-blue-400 hover:underline"
                                                    >
                                                        Upload one in the Library
                                                    </a>
                                                </div>
                                            ) : (
                                                documents.map((doc) => (
                                                    <button
                                                        key={doc.id}
                                                        onClick={() => {
                                                            setSelectedDocId(doc.id);
                                                            setIsDocSelectorOpen(false);
                                                        }}
                                                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors ${
                                                            selectedDocId === doc.id ? 'bg-purple-500/10' : ''
                                                        }`}
                                                    >
                                                        <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                                            <FileText className="h-4 w-4 text-purple-400" />
                                                        </div>
                                                        <div className="text-left flex-1 min-w-0">
                                                            <div className="text-sm text-white truncate">
                                                                {doc.filename}
                                                            </div>
                                                            <div className="text-xs text-white/50">
                                                                {doc.pages ? `${doc.pages} pages` : 'Document'}
                                                            </div>
                                                        </div>
                                                        {selectedDocId === doc.id && (
                                                            <div className="ml-auto h-2 w-2 rounded-full bg-purple-500" />
                                                        )}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Chat Area */}
                        <div className="flex-1 flex flex-col min-h-0 rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4">
                                {messages.length === 0 ? (
                                    // Empty state
                                    <div className="h-full flex flex-col items-center justify-center text-center px-4">
                                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center mb-6">
                                            <Sparkles className="h-10 w-10 text-blue-400" />
                                        </div>
                                        <h3 className="text-white font-semibold text-xl mb-2">
                                            {selectedDoc
                                                ? `Ask about "${selectedDoc.filename}"`
                                                : "Hi! I'm your AI Tutor"}
                                        </h3>
                                        <p className="text-white/50 text-sm max-w-md mb-8">
                                            {selectedDoc
                                                ? 'Ask questions about this document and I\'ll provide answers with page citations.'
                                                : 'I can help you learn any subject. Select a document above for grounded answers, or ask general questions.'}
                                        </p>

                                        {/* Quick suggestions */}
                                        <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                                            {suggestions.map((suggestion) => (
                                                <button
                                                    key={suggestion}
                                                    onClick={() => setInputValue(suggestion)}
                                                    className="px-4 py-2 rounded-full bg-white/5 border border-white/10
                                                               text-white/70 text-sm hover:bg-white/10 hover:border-white/20
                                                               transition-colors flex items-center gap-2"
                                                >
                                                    <Lightbulb className="h-3 w-3" />
                                                    {suggestion}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Features hint */}
                                        <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
                                            <div className="text-center">
                                                <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center mx-auto mb-2">
                                                    <MessageSquare className="h-5 w-5 text-green-400" />
                                                </div>
                                                <div className="text-xs text-white/50">Natural Chat</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center mx-auto mb-2">
                                                    <BookOpen className="h-5 w-5 text-purple-400" />
                                                </div>
                                                <div className="text-xs text-white/50">Document Context</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-2">
                                                    <FileText className="h-5 w-5 text-amber-400" />
                                                </div>
                                                <div className="text-xs text-white/50">Page Citations</div>
                                            </div>
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
                                                    <div className="flex items-center gap-3 text-white/50">
                                                        <div className="flex gap-1">
                                                            <div
                                                                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                                                                style={{ animationDelay: '0ms' }}
                                                            />
                                                            <div
                                                                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                                                                style={{ animationDelay: '150ms' }}
                                                            />
                                                            <div
                                                                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                                                                style={{ animationDelay: '300ms' }}
                                                            />
                                                        </div>
                                                        <span className="text-sm">
                                                            {isIndexing
                                                                ? 'Indexing document...'
                                                                : 'Thinking...'}
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
                                <div className="mx-4 mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
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
                            <div className="border-t border-white/10 p-4">
                                <div className="flex gap-3">
                                    <textarea
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={
                                            selectedDoc
                                                ? `Ask about ${selectedDoc.filename}...`
                                                : 'Ask me anything...'
                                        }
                                        disabled={isLoading}
                                        rows={1}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3
                                                   text-white placeholder-white/30 resize-none
                                                   focus:outline-none focus:border-blue-500/50 disabled:opacity-50
                                                   text-sm transition-colors"
                                        style={{ minHeight: '48px', maxHeight: '120px' }}
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={!inputValue.trim() || isLoading}
                                        className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500
                                                   text-white font-semibold text-sm shadow-lg shadow-blue-500/25
                                                   hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed
                                                   disabled:shadow-none transition-all flex items-center gap-2"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                        Send
                                    </button>
                                </div>

                                {/* Keyboard hint */}
                                <div className="mt-2 text-center text-xs text-white/30">
                                    Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded">Enter</kbd> to send,{' '}
                                    <kbd className="px-1.5 py-0.5 bg-white/10 rounded">Shift+Enter</kbd> for new line
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Citation panel */}
            <CitationPanel source={selectedSource} onClose={() => setSelectedSource(null)} />
        </div>
    );
}
