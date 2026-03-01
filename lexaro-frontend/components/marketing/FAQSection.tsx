// components/marketing/FAQSection.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { HelpCircle, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { FAQ_ITEMS } from "@/lib/marketing-data";

export default function FAQSection() {
    const [open, setOpen] = useState<number>(0);

    return (
        <div className="grid gap-8 lg:grid-cols-5">
            {/* Left: "Still have questions?" card */}
            <div className="lg:col-span-2">
                <div className="glass-card p-8 text-center lg:sticky lg:top-28">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.08]">
                        <HelpCircle className="h-6 w-6 text-white/50" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                        Still Have Questions?
                    </h3>
                    <p className="text-sm text-white/50 mb-6">
                        Feel free to reach out — we are happy to help.
                    </p>
                    <Link
                        href="/contact"
                        className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-5 py-2 text-sm text-white/80 transition-colors hover:bg-white/[0.08] hover:text-white"
                    >
                        Ask A Question
                    </Link>
                </div>
            </div>

            {/* Right: accordion */}
            <div className="lg:col-span-3 flex flex-col gap-3">
                {FAQ_ITEMS.map((item, idx) => {
                    const isOpen = open === idx;
                    return (
                        <div key={idx} className="glass-card overflow-hidden">
                            <button
                                onClick={() => setOpen(isOpen ? -1 : idx)}
                                aria-expanded={isOpen}
                                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                            >
                                <span className="text-sm font-medium text-white/90">{item.q}</span>
                                <motion.span
                                    initial={false}
                                    animate={{ rotate: isOpen ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex-shrink-0 text-white/40"
                                >
                                    <ChevronDown className="h-4 w-4" />
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
                                        <p className="px-5 pb-5 text-sm text-white/60 leading-relaxed">
                                            {item.a}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
