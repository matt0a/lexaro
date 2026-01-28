'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
    FlashcardDeck,
    Flashcard,
    generateFlashcards,
    getFlashcardDecks,
    deleteFlashcardDeck
} from '@/lib/educationApi';

type ViewMode = 'list' | 'generate' | 'study';

export default function EducationDocFlashcardsPage() {
    const params = useParams();
    const docId = Number(params.id);

    const [decks, setDecks] = useState<FlashcardDeck[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [currentDeck, setCurrentDeck] = useState<FlashcardDeck | null>(null);

    // Generation options
    const [cardCount, setCardCount] = useState(10);

    // Study mode state
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [knownCards, setKnownCards] = useState<Set<number>>(new Set());
    const [missedCards, setMissedCards] = useState<Set<number>>(new Set());

    // Load decks on mount
    useEffect(() => {
        loadDecks();
    }, [docId]);

    async function loadDecks() {
        setLoading(true);
        setError(null);
        try {
            const data = await getFlashcardDecks(docId);
            setDecks(data);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to load flashcard decks');
        } finally {
            setLoading(false);
        }
    }

    async function handleGenerate() {
        setGenerating(true);
        setError(null);
        try {
            const deck = await generateFlashcards(docId, { cardCount });
            setDecks(prev => [deck, ...prev]);
            startStudy(deck);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to generate flashcards');
        } finally {
            setGenerating(false);
        }
    }

    async function handleDelete(deckId: number) {
        if (!confirm('Are you sure you want to delete this flashcard deck?')) return;
        try {
            await deleteFlashcardDeck(deckId);
            setDecks(prev => prev.filter(d => d.id !== deckId));
            if (currentDeck?.id === deckId) {
                setCurrentDeck(null);
                setViewMode('list');
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to delete flashcard deck');
        }
    }

    function startStudy(deck: FlashcardDeck) {
        setCurrentDeck(deck);
        setCurrentCardIndex(0);
        setIsFlipped(false);
        setKnownCards(new Set());
        setMissedCards(new Set());
        setViewMode('study');
    }

    function flipCard() {
        setIsFlipped(!isFlipped);
    }

    function markKnown() {
        if (!currentDeck) return;
        const card = currentDeck.cards[currentCardIndex];
        setKnownCards(prev => new Set([...prev, card.id]));
        nextCard();
    }

    function markMissed() {
        if (!currentDeck) return;
        const card = currentDeck.cards[currentCardIndex];
        setMissedCards(prev => new Set([...prev, card.id]));
        nextCard();
    }

    function nextCard() {
        if (!currentDeck) return;
        setIsFlipped(false);
        if (currentCardIndex < currentDeck.cards.length - 1) {
            setCurrentCardIndex(prev => prev + 1);
        }
    }

    function prevCard() {
        setIsFlipped(false);
        if (currentCardIndex > 0) {
            setCurrentCardIndex(prev => prev - 1);
        }
    }

    function restartStudy() {
        setCurrentCardIndex(0);
        setIsFlipped(false);
        setKnownCards(new Set());
        setMissedCards(new Set());
    }

    // Calculate progress
    const totalCards = currentDeck?.cards.length || 0;
    const reviewedCards = knownCards.size + missedCards.size;
    const isComplete = reviewedCards === totalCards && totalCards > 0;

    // Render based on view mode
    if (viewMode === 'generate') {
        return (
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Generate Flashcards</h2>

                <div className="mb-6">
                    <label className="block text-white/70 text-sm mb-3">Number of Cards</label>
                    <div className="flex gap-2 flex-wrap">
                        {[5, 10, 15, 20, 25, 30].map(n => (
                            <button
                                key={n}
                                onClick={() => setCardCount(n)}
                                className={`px-4 py-2 rounded-lg transition ${
                                    cardCount === n
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                                }`}
                            >
                                {n}
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
                        {generating ? 'Generating...' : 'Generate Flashcards'}
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

    if (viewMode === 'study' && currentDeck) {
        const currentCard = currentDeck.cards[currentCardIndex];

        // Show completion screen
        if (isComplete) {
            const knownPercent = Math.round((knownCards.size / totalCards) * 100);
            return (
                <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                    <h2 className="text-xl font-semibold text-white mb-6 text-center">Study Complete!</h2>

                    <div className="bg-white/5 rounded-xl p-6 mb-6 text-center">
                        <div className="text-5xl font-bold text-green-400 mb-2">
                            {knownPercent}%
                        </div>
                        <div className="text-white/70">
                            {knownCards.size} known / {missedCards.size} need review
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-green-500/10 rounded-xl p-4 text-center">
                            <div className="text-3xl font-bold text-green-400">{knownCards.size}</div>
                            <div className="text-white/50 text-sm">Cards Known</div>
                        </div>
                        <div className="bg-orange-500/10 rounded-xl p-4 text-center">
                            <div className="text-3xl font-bold text-orange-400">{missedCards.size}</div>
                            <div className="text-white/50 text-sm">Need Review</div>
                        </div>
                    </div>

                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={restartStudy}
                            className="px-6 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-500 transition"
                        >
                            Study Again
                        </button>
                        <button
                            onClick={() => {
                                setViewMode('list');
                                setCurrentDeck(null);
                            }}
                            className="px-6 py-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition"
                        >
                            Back to Decks
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-white">{currentDeck.title}</h2>
                    <span className="text-white/50 text-sm">
                        Card {currentCardIndex + 1} of {totalCards}
                    </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-white/10 rounded-full h-2 mb-6">
                    <div
                        className="bg-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${((currentCardIndex + 1) / totalCards) * 100}%` }}
                    />
                </div>

                {/* Flashcard with flip animation */}
                <div className="mb-6 [perspective:1000px]">
                    <div
                        onClick={flipCard}
                        className={`relative w-full min-h-[280px] cursor-pointer transition-all duration-700 ease-in-out [transform-style:preserve-3d] ${
                            isFlipped ? '[transform:rotateY(180deg)]' : '[transform:rotateY(0deg)]'
                        }`}
                    >
                        {/* Front of card */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 to-blue-600/30 rounded-2xl border border-purple-500/30 p-8 flex flex-col items-center justify-center [backface-visibility:hidden] shadow-lg shadow-purple-500/10">
                            <div className="text-purple-300/70 text-xs mb-4 uppercase tracking-widest font-medium">Question</div>
                            <div className="text-white text-xl text-center font-medium leading-relaxed px-4">
                                {currentCard.front}
                            </div>
                            <div className="text-white/40 text-sm mt-8 flex items-center gap-2">
                                <span className="inline-block w-4 h-4 border border-white/40 rounded animate-pulse" />
                                Click to reveal answer
                            </div>
                        </div>

                        {/* Back of card */}
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/30 to-teal-600/30 rounded-2xl border border-emerald-500/30 p-8 flex flex-col items-center justify-center [backface-visibility:hidden] [transform:rotateY(180deg)] shadow-lg shadow-emerald-500/10">
                            <div className="text-emerald-300/70 text-xs mb-4 uppercase tracking-widest font-medium">Answer</div>
                            <div className="text-white text-xl text-center font-medium leading-relaxed px-4">
                                {currentCard.back}
                            </div>
                            <div className="text-white/40 text-sm mt-8 flex items-center gap-2">
                                <span className="inline-block w-4 h-4 border border-white/40 rounded animate-pulse" />
                                Click to flip back
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation and rating buttons */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={prevCard}
                        disabled={currentCardIndex === 0}
                        className="px-4 py-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                        Previous
                    </button>

                    <div className="flex gap-3">
                        <button
                            onClick={markMissed}
                            className="px-6 py-2 rounded-lg bg-orange-500/20 text-orange-400 font-medium hover:bg-orange-500/30 transition"
                        >
                            Need Review
                        </button>
                        <button
                            onClick={markKnown}
                            className="px-6 py-2 rounded-lg bg-green-500/20 text-green-400 font-medium hover:bg-green-500/30 transition"
                        >
                            Got It!
                        </button>
                    </div>

                    <button
                        onClick={nextCard}
                        disabled={currentCardIndex === totalCards - 1}
                        className="px-4 py-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                        Next
                    </button>
                </div>

                {/* Progress indicator */}
                <div className="mt-6 flex justify-center gap-4 text-sm">
                    <span className="text-green-400">{knownCards.size} known</span>
                    <span className="text-white/30">|</span>
                    <span className="text-orange-400">{missedCards.size} need review</span>
                    <span className="text-white/30">|</span>
                    <span className="text-white/50">{totalCards - reviewedCards} remaining</span>
                </div>

                {/* Exit button */}
                <div className="mt-6 text-center">
                    <button
                        onClick={() => {
                            setViewMode('list');
                            setCurrentDeck(null);
                        }}
                        className="text-white/50 hover:text-white/70 text-sm underline transition"
                    >
                        Exit Study Mode
                    </button>
                </div>
            </div>
        );
    }

    // Default: list view
    return (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">Flashcards</h2>
                <button
                    onClick={() => setViewMode('generate')}
                    className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-500 transition"
                >
                    + Generate Flashcards
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-300 text-sm">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="text-white/50 text-center py-8">Loading flashcard decks...</div>
            ) : decks.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-white/30 text-4xl mb-4">🃏</div>
                    <p className="text-white/70 mb-4">No flashcard decks yet</p>
                    <p className="text-white/50 text-sm mb-6">
                        Generate AI-powered flashcards to help you memorize key concepts.
                    </p>
                    <button
                        onClick={() => setViewMode('generate')}
                        className="px-6 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-500 transition"
                    >
                        Generate Your First Deck
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {decks.map(deck => (
                        <div
                            key={deck.id}
                            className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition"
                        >
                            <div className="flex items-center gap-4">
                                <span className="text-2xl">🃏</span>
                                <div>
                                    <h3 className="text-white font-medium">{deck.title}</h3>
                                    <p className="text-white/50 text-sm">
                                        {deck.cardCount} cards • {new Date(deck.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => startStudy(deck)}
                                    className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-500 transition"
                                >
                                    Study
                                </button>
                                <button
                                    onClick={() => handleDelete(deck.id)}
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
