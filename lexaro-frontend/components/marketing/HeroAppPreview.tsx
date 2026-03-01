"use client";

/**
 * HeroAppPreview — static marketing mockup of the Lexaro education UI.
 *
 * Renders a realistic, non-interactive preview of the Lexaro study experience:
 *   - Browser chrome bar
 *   - Sidebar: document list (first doc highlighted)
 *   - Main panel: tab navigation (Chat / Flashcards / Notes / Quizzes)
 *   - Tab content: unique static preview for each tab
 *
 * Design tokens match the real app (bg-white/5, border-white/10, #228CDB accent).
 *
 * Accessibility:
 *   - aria-hidden="true" on the root — entirely decorative
 *   - tabIndex={-1} on all buttons/interactive-looking elements — no keyboard trap
 *   - type="button" on every <button>
 *
 * Static only — no auth, no API calls, no global providers, no routing.
 * All data is defined inline as local constants.
 */

import React, { useState } from "react";
import { FileText, Sparkles, Send, BookOpen, Layers, FileQuestion } from "lucide-react";

/* ── Mock data ──────────────────────────────────────────────────────────── */

const DOCS = [
    { name: "Biology Notes.pdf",   ext: "PDF", color: "#EF4444" },
    { name: "History Essay.docx",  ext: "DOC", color: "#3B82F6" },
    { name: "Chem Lab.pdf",        ext: "PDF", color: "#EF4444" },
] as const;

const TABS = ["Chat", "Flashcards", "Notes", "Quizzes"] as const;
type Tab = typeof TABS[number];

const TAB_ICONS: Record<Tab, React.ReactNode> = {
    Chat:       <Sparkles className="h-2.5 w-2.5" />,
    Flashcards: <Layers className="h-2.5 w-2.5" />,
    Notes:      <BookOpen className="h-2.5 w-2.5" />,
    Quizzes:    <FileQuestion className="h-2.5 w-2.5" />,
};

/* ── Tab content subcomponents ──────────────────────────────────────────── */

/**
 * ChatContent — AI tutor conversation with citation chip and flashcard chips.
 */
function ChatContent() {
    return (
        <>
            {/* AI message with citation */}
            <div className="flex gap-2">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#228CDB]/[0.12]">
                    <Sparkles className="h-3 w-3 text-[#228CDB]/70" />
                </div>
                <div className="flex-1 rounded-xl rounded-tl-none border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-[11px] leading-relaxed text-white/55">
                    Based on{" "}
                    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[9px] bg-[#228CDB]/15 text-[#228CDB]/80 font-medium">
                        p.12
                    </span>
                    {", "}
                    the mitochondria produces ATP through oxidative phosphorylation
                    using the electron transport chain.
                </div>
            </div>

            {/* User message */}
            <div className="flex flex-row-reverse gap-2">
                <div className="h-6 w-6 flex-shrink-0 rounded-full bg-white/[0.07]" />
                <div className="rounded-xl rounded-tr-none border border-[#228CDB]/20 bg-[#228CDB]/[0.08] px-3 py-2 text-[11px] text-white/60">
                    Can you make flashcards from this?
                </div>
            </div>

            {/* AI reply with generated flashcard chips */}
            <div className="flex gap-2">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#228CDB]/[0.12]">
                    <Sparkles className="h-3 w-3 text-[#228CDB]/70" />
                </div>
                <div className="flex-1 space-y-2">
                    <div className="rounded-xl rounded-tl-none border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-[11px] text-white/55">
                        Generated{" "}
                        <span className="font-semibold text-white/80">8 flashcards</span>
                        {" "}from Biology Notes.pdf
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                        {["ATP synthesis", "Krebs cycle", "Cell membrane", "Photosynthesis"].map(
                            (term) => (
                                <div
                                    key={term}
                                    className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-center text-[10px] text-white/35"
                                >
                                    {term}
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

/**
 * FlashcardContent — front-side flashcard preview with progress indicator.
 */
function FlashcardContent() {
    return (
        <div className="flex flex-col gap-2 h-full">
            {/* Progress */}
            <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/30">Card 2 of 8</span>
                <div className="flex gap-1">
                    {[...Array(8)].map((_, i) => (
                        <div
                            key={i}
                            className={`h-1 w-4 rounded-full ${
                                i < 2 ? "bg-[#228CDB]/50" : "bg-white/10"
                            }`}
                        />
                    ))}
                </div>
            </div>

            {/* Card front */}
            <div className="flex-1 flex flex-col items-center justify-center rounded-xl border border-[#228CDB]/20 bg-gradient-to-br from-[#228CDB]/[0.14] to-[#4DA3FF]/[0.05] p-4 text-center">
                <p className="mb-3 text-[9px] font-semibold uppercase tracking-widest text-white/30">
                    Question
                </p>
                <p className="text-[11px] text-white/70 leading-relaxed">
                    What is the role of ATP synthase in cellular respiration?
                </p>
                <p className="mt-3 text-[9px] text-white/20">Tap to reveal answer →</p>
            </div>
        </div>
    );
}

/**
 * NotesContent — static outline-style notes preview.
 */
function NotesContent() {
    return (
        <div className="space-y-2">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-white/25">
                Outline Notes — Biology Notes.pdf
            </p>
            <div className="space-y-1.5 text-[10px] text-white/50">
                <p className="font-semibold text-white/60">I. Cell Structure</p>
                <p className="pl-4">A. Mitochondria — powerhouse of the cell</p>
                <p className="pl-4">B. Cell membrane — selective permeability</p>
                <p className="font-semibold text-white/60 pt-1">II. Energy Production</p>
                <p className="pl-4">A. ATP synthesis via oxidative phosphorylation</p>
                <p className="pl-4">B. Krebs cycle — citric acid cycle overview</p>
                <p className="font-semibold text-white/60 pt-1">III. Photosynthesis</p>
                <p className="pl-4">A. Light-dependent reactions</p>
                <p className="pl-4">B. Calvin cycle</p>
            </div>
        </div>
    );
}

/**
 * QuizContent — static multiple-choice question preview.
 */
function QuizContent() {
    const options = [
        "Glycolysis in the cytoplasm",
        "Oxidative phosphorylation in mitochondria",
        "The Calvin cycle in chloroplasts",
        "Fermentation in the cytosol",
    ];

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-[9px] font-semibold uppercase tracking-widest text-white/25">
                    Question 1 of 5
                </span>
            </div>
            <p className="text-[11px] text-white/70 leading-relaxed">
                Which process produces the most ATP during cellular respiration?
            </p>
            <div className="space-y-1.5 pt-1">
                {options.map((opt, i) => (
                    <button
                        key={opt}
                        type="button"
                        tabIndex={-1}
                        className={`w-full rounded-lg border px-2.5 py-1.5 text-left text-[10px] transition-none ${
                            i === 1
                                ? "border-[#228CDB]/20 bg-[#228CDB]/[0.10] text-white/70"
                                : "border-white/[0.06] bg-white/[0.02] text-white/35"
                        }`}
                    >
                        <span className="mr-1.5 font-semibold">
                            {String.fromCharCode(65 + i)}.
                        </span>
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );
}

/* ── Main component ─────────────────────────────────────────────────────── */

export default function HeroAppPreview() {
    const [tab, setTab] = useState<Tab>("Chat");

    return (
        /* aria-hidden: entirely decorative — screen readers skip this block */
        <div
            aria-hidden="true"
            className="shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_24px_64px_rgba(0,0,0,0.5)]"
        >
            <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">

                {/* ── Browser chrome ── */}
                <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-4 py-3">
                    <div className="h-2 w-2 rounded-full bg-white/[0.10]" />
                    <div className="h-2 w-2 rounded-full bg-white/[0.10]" />
                    <div className="h-2 w-2 rounded-full bg-white/[0.10]" />
                    <span className="mx-auto text-[11px] tracking-wide text-white/20">
                        lexaro.app/education
                    </span>
                </div>

                {/* ── App body ── */}
                <div className="grid sm:grid-cols-[160px_1fr]">

                    {/* ── Sidebar: document list (hidden on mobile) ── */}
                    <div className="hidden sm:flex flex-col gap-0.5 border-r border-white/[0.06] p-3">
                        <p className="px-1 pb-2 text-[9px] font-semibold uppercase tracking-widest text-white/20">
                            Documents
                        </p>
                        {DOCS.map((doc, i) => (
                            <div
                                key={doc.name}
                                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${
                                    i === 0
                                        ? "bg-[#228CDB]/[0.08] border border-[#228CDB]/[0.15]"
                                        : ""
                                }`}
                            >
                                {/* Coloured file-type square */}
                                <div
                                    className="h-2.5 w-2.5 flex-shrink-0 rounded-sm"
                                    style={{ background: doc.color, opacity: i === 0 ? 0.7 : 0.25 }}
                                />
                                <span
                                    className={`truncate text-[10px] ${
                                        i === 0 ? "text-white/60" : "text-white/25"
                                    }`}
                                >
                                    {doc.name}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* ── Main panel ── */}
                    <div className="flex min-w-0 flex-col">

                        {/* Tab navigation */}
                        <div className="flex items-center gap-0.5 overflow-x-auto border-b border-white/[0.05] px-3 pb-1 pt-2">
                            {TABS.map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    tabIndex={-1}
                                    onClick={() => setTab(t)}
                                    className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] transition-none ${
                                        tab === t
                                            ? "border border-[#228CDB]/20 bg-[#228CDB]/[0.10] font-semibold text-[#228CDB]/80"
                                            : "text-white/25 hover:text-white/40"
                                    }`}
                                >
                                    {TAB_ICONS[t]}
                                    {t}
                                </button>
                            ))}
                        </div>

                        {/* Tab content */}
                        <div className="flex flex-1 flex-col gap-2.5 overflow-hidden p-3">
                            {tab === "Chat"       && <ChatContent />}
                            {tab === "Flashcards" && <FlashcardContent />}
                            {tab === "Notes"      && <NotesContent />}
                            {tab === "Quizzes"    && <QuizContent />}
                        </div>

                        {/* Input row — visible on Chat tab only */}
                        {tab === "Chat" && (
                            <div className="flex items-center gap-2 px-3 pb-3 pt-1">
                                <div className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[10px] text-white/20">
                                    Ask anything about your document...
                                </div>
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-[#228CDB]/15 bg-[#228CDB]/[0.10]"
                                >
                                    <Send className="h-3 w-3 text-[#228CDB]/60" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
