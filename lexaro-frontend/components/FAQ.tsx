// components/FAQ.tsx
"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

type QA = { q: string; a: string };

const ITEMS: QA[] = [
    // ✅ Learn / Education
    {
        q: "What is Lexaro Learn?",
        a: "Lexaro Learn is your document-based study area: chat with your PDFs beside the page, get answers with page links, and generate notes, flashcards, quizzes, essay feedback, and study plans.",
    },
    {
        q: "Do answers include citations / page links?",
        a: "Yes — Lexaro is designed to point back to your materials so you can verify quickly and jump to the exact page.",
    },
    {
        q: "Can I choose quiz difficulty?",
        a: "Yes — quizzes can be generated as Easy, Medium, or Hard depending on whether you want recall practice or deeper challenge questions.",
    },
    {
        q: "What does the essay grader do?",
        a: "You can paste or upload an essay and get structured feedback: strengths, weaknesses, score breakdowns, and specific improvements.",
    },
    {
        q: "What is the study calendar?",
        a: "It generates a study plan and daily tasks based on your exam date and availability, so you stay consistent instead of cramming.",
    },

    // ✅ Voice / TTS (your existing)
    {
        q: "What is TTS (text to speech)?",
        a: "Text to speech, sometimes called TTS, read aloud, or speech synthesis, is the term for using AI voices to turn any input text into speech.",
    },
    {
        q: "What is an AI voice?",
        a: "An AI voice refers to the synthesized or generated speech produced by artificial intelligence systems, enabling machines to communicate with human-like speech.",
    },
    {
        q: "Who is Lexaro for?",
        a: "Lexaro is for everyone, including seniors, students, professionals, and anyone who benefits from listening to written content read aloud.",
    },
    {
        q: "Does Lexaro's voices sound natural?",
        a: "Yes. Lexaro’s text to speech reader has natural, human-sounding voices available in multiple languages.",
    },
    {
        q: "Is Lexaro available in different languages?",
        a: "Yes, Lexaro supports many of the most frequently spoken languages around the world.",
    },
];

export default function FAQ() {
    const [open, setOpen] = useState<number>(0);

    return (
        <section className="bg-black py-24">
            <div className="section">
                <h2 className="h1 mb-10 text-center text-white">FAQ</h2>

                <div className="overflow-hidden rounded-[1.25rem] border border-white/10 bg-[var(--card)]">
                    {ITEMS.map((item, idx) => {
                        const isOpen = open === idx;
                        return (
                            <div key={idx} className="border-b border-white/10 last:border-0">
                                <button
                                    onClick={() => setOpen(isOpen ? -1 : idx)}
                                    aria-expanded={isOpen}
                                    className="flex w-full items-center justify-between gap-6 px-5 py-5 text-left hover:bg-white/5"
                                >
                                    <span className="text-white/95">{item.q}</span>

                                    <motion.span
                                        initial={false}
                                        animate={{ rotate: isOpen ? 180 : 0 }}
                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                        className="h-5 w-5 text-white/70"
                                    >
                                        {isOpen ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                                    </motion.span>
                                </button>

                                <AnimatePresence initial={false}>
                                    {isOpen && (
                                        <motion.div
                                            key="content"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.25, ease: "easeOut" }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-5 pb-6 pt-1">
                                                <p className="text-white/80">{item.a}</p>
                                                <div className="mt-4 flex justify-end gap-2">
                                                    <Link href="/about/features" className="btn-accent">
                                                        Full feature list
                                                    </Link>
                                                    <Link href="/get-started" className="btn-accent">
                                                        Try for Free
                                                    </Link>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
