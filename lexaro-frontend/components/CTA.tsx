// components/CTA.tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function CTA() {
    return (
        <section className="py-24 sm:py-28">
            <div className="mx-auto max-w-4xl text-center">
                <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    viewport={{ once: true }}
                    className="text-3xl sm:text-5xl font-semibold tracking-tight text-white"
                >
                    Upgrade the way you study.
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                    viewport={{ once: true }}
                    className="mt-4 text-white/70"
                >
                    Upload PDFs, ask questions with page links, generate notes/flashcards/quizzes, grade essays,
                    and plan your week — then listen with natural voices.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    viewport={{ once: true }}
                    className="mt-8"
                >
                    <Link
                        href="/get-started"
                        className="inline-flex rounded-full bg-white text-black px-4 md:px-6 py-3 text-sm font-semibold hover:bg-white/90"
                    >
                        Create Your Account →
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
