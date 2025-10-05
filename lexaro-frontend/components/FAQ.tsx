'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';

type Item = {
    q: string;
    a: string;
    cta: 'Try For Free' | 'Get Started';
};

const ITEMS: Item[] = [
    {
        q: 'What is TTS (text to speech)?',
        a: 'Text to speech, sometimes called TTS, read aloud, or speech synthesis, is the term for using AI voices to turn any input text into speech.',
        cta: 'Try For Free',
    },
    {
        q: 'What is an AI voice?',
        a: 'An AI voice refers to the synthesized or generated speech produced by artificial intelligence systems, enabling machines to communicate with human-like speech.',
        cta: 'Get Started',
    },
    {
        q: 'Who is Lexaro for?',
        a: 'Lexaro is for everyone, including seniors, students, professionals, and anyone who benefits from listening to written content read aloud.',
        cta: 'Get Started',
    },
    {
        q: "Does Lexaro's voices sound natural?",
        a: 'Yes. Lexaro’s text to speech reader has the most natural, human-sounding voice overs available on the market. The voices are now indistinguishable from human voices and available in several different languages including Spanish, Portuguese, German, French, and more.',
        cta: 'Get Started',
    },
    {
        q: 'Is Lexaro available in different languages?',
        a: 'Yes, Lexaro has support for over 45 of the most frequently spoken languages around the world.',
        cta: 'Get Started',
    },
];

export default function FAQ() {
    const [open, setOpen] = useState<number | null>(0); // first item open by default

    return (
        <section id="faq" className="section my-28 sm:my-36">
            <h2 className="text-center text-4xl md:text-5xl font-semibold text-white mb-10">
                FAQ
            </h2>

            <div className="mx-auto max-w-3xl divide-y divide-white/10 rounded-2xl bg-[var(--surface)]/40 ring-1 ring-white/10 backdrop-blur">
                {ITEMS.map((item, i) => {
                    const isOpen = open === i;
                    return (
                        <div key={i} className="px-4 sm:px-6">
                            <button
                                type="button"
                                aria-expanded={isOpen}
                                onClick={() => setOpen(isOpen ? null : i)}
                                className="flex w-full items-center justify-between py-5 text-left text-white/90 hover:text-white focus:outline-none"
                            >
                                <span className="text-lg">{item.q}</span>
                                <span
                                    className="ml-4 inline-flex h-7 w-7 items-center justify-center rounded-full ring-1 ring-white/15 text-white/80"
                                    aria-hidden
                                >
                  {isOpen ? '−' : '+'}
                </span>
                            </button>

                            <AnimatePresence initial={false}>
                                {isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                                        className="overflow-hidden"
                                    >
                                        <div className="pb-6 text-white/80">
                                            <p className="leading-relaxed">{item.a}</p>
                                            <div className="mt-4">
                                                <Link
                                                    href="/signup"
                                                    className={`${
                                                        item.cta === 'Try For Free'
                                                            ? 'btn-white'
                                                            : 'btn-primary'
                                                    }`}
                                                >
                                                    {item.cta}
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
        </section>
    );
}
