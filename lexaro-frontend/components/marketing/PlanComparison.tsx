import React from "react";

type CellValue = boolean | string | undefined;

const Row = ({
                 label,
                 hint,
                 free,
                 premium,
                 plus,
             }: {
    label: string;
    hint?: string;
    free?: CellValue;
    premium?: CellValue;
    plus?: CellValue;
}) => (
    <div className="grid grid-cols-4 items-center border-t border-white/10 px-4 py-3 text-sm">
        <div className="min-w-0">
            <div className="text-gray-200 font-medium">{label}</div>
            {hint ? <div className="mt-1 text-xs text-white/45">{hint}</div> : null}
        </div>
        <Cell value={free} />
        <Cell value={premium} />
        <Cell value={plus} />
    </div>
);

/* ✅ Crisp, centered icons */
const Check = () => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        className="text-emerald-400"
        aria-hidden
    >
        <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 6 9 17l-5-5"
        />
    </svg>
);

const Cross = () => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        className="text-red-400"
        aria-hidden
    >
        <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12" />
            <path d="M18 6L6 18" />
        </g>
    </svg>
);

function Cell({ value }: { value?: CellValue }) {
    return (
        <div className="flex min-h-[36px] items-center justify-center leading-none">
            {value === true && <Check />}
            {value === false && <Cross />}
            {typeof value === "string" && (
                <span className="text-gray-100 text-center px-2">{value}</span>
            )}
            {value === undefined && <span className="text-white/35">—</span>}
        </div>
    );
}

export default function PlanComparison() {
    return (
        <section className="relative mt-24 overflow-hidden px-4">
            {/* subtle background bloom so it feels premium but not “light” */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/2 top-10 h-[460px] w-[920px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />
                <div className="absolute left-1/3 top-44 h-[380px] w-[760px] -translate-x-1/2 rounded-full bg-fuchsia-500/10 blur-3xl" />
            </div>

            <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-black/55 backdrop-blur-md shadow-[0_30px_120px_rgba(0,0,0,.7)]">
                {/* top header */}
                <div className="px-4 md:px-6 pt-8 pb-6">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-3xl md:text-4xl font-semibold">
                            Compare plans
                        </h2>
                        <p className="mt-3 text-white/65">
                            Premium tiers unlock higher limits, faster responses, and better
                            reliability.
                        </p>
                    </div>
                </div>

                {/* column headers */}
                <div className="grid grid-cols-4 items-center px-4 pb-4 text-sm font-semibold">
                    <div />
                    <div className="text-center">
            <span className="inline-flex rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-white/70">
              Free
            </span>
                    </div>
                    <div className="text-center">
            <span className="inline-flex rounded-full bg-sky-500/15 border border-sky-400/25 px-3 py-1 text-xs text-sky-200">
              Premium
            </span>
                    </div>
                    <div className="text-center">
            <span className="inline-flex rounded-full bg-fuchsia-500/15 border border-fuchsia-400/25 px-3 py-1 text-xs text-fuchsia-200">
              Premium+
            </span>
                    </div>
                </div>

                {/* rows */}
                <div className="px-0 pb-2">
                    {/* Lexaro Learn (new) */}
                    <Row
                        label="Study Copilot (Q&A with citations)"
                        hint="Answers include page links so you can verify quickly."
                        free="Limited"
                        premium="Unlimited"
                        plus="Unlimited"
                    />
                    <Row
                        label="Generate notes"
                        hint="Turn chapters into clean study notes."
                        free="Limited"
                        premium="Unlimited"
                        plus="Unlimited"
                    />
                    <Row
                        label="Generate flashcards + quizzes"
                        hint="Practice instantly from your material."
                        free="Limited"
                        premium="Unlimited"
                        plus="Unlimited"
                    />
                    <Row
                        label="OCR + PDF extraction"
                        hint="Scanned pages and PDFs supported."
                        free={true}
                        premium={true}
                        plus={true}
                    />
                    <Row
                        label="Docs processed / library"
                        hint="How much material you can work with."
                        free="Monthly cap"
                        premium="Unlimited"
                        plus="Unlimited"
                    />

                    {/* Voice + translation */}
                    <Row
                        label="Text-to-speech (monthly words)"
                        hint="Listen to notes, chapters, and outputs."
                        free="10,000"
                        premium="150,000"
                        plus="350,000"
                    />
                    <Row
                        label="Translation"
                        hint="Translate then listen — great for bilingual learners."
                        free={true}
                        premium={true}
                        plus={true}
                    />

                    {/* Quality / speed */}
                    <Row
                        label="Speed + concurrency"
                        hint="How fast it feels when you’re studying daily."
                        free="Standard"
                        premium="Faster"
                        plus="Fastest"
                    />
                    <Row
                        label="Reliability safeguards"
                        hint="Better formatting + citation checks on paid tiers."
                        free="Basic"
                        premium="Strong"
                        plus="Best"
                    />

                    {/* Existing voice positioning (keep your marketing) */}
                    <Row
                        label="Voices"
                        hint="Premium tiers unlock better voice quality."
                        free="Robotic/basic"
                        premium="Natural (200+)"
                        plus="Studio & Pro"
                    />
                    <Row
                        label="Languages"
                        free="Up to 5"
                        premium="60+"
                        plus="60+"
                    />
                    <Row
                        label="Offline MP3 download"
                        free={false}
                        premium={true}
                        plus={true}
                    />
                    <Row
                        label="Max speed"
                        free="1x"
                        premium="3.5x"
                        plus="10x"
                    />

                    {/* Support */}
                    <Row
                        label="Priority support"
                        hint="Faster help on paid tiers."
                        free="Email"
                        premium="Priority"
                        plus="VIP"
                    />
                </div>

                {/* CTA buttons */}
                <div className="px-4 md:px-6 py-7 border-t border-white/10">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <a
                            href="#plans"
                            className="w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-center font-semibold text-white hover:bg-black/55 transition"
                        >
                            Choose Free
                        </a>
                        <a
                            href="#plans"
                            className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-center font-semibold text-white hover:bg-blue-500 transition"
                        >
                            Start Premium
                        </a>
                        <a
                            href="#plans"
                            className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-center font-semibold text-gray-900 hover:bg-white/90 transition"
                        >
                            Go Premium+
                        </a>
                    </div>

                    <p className="mt-3 text-center text-xs text-white/45">
                        “Unlimited” means no monthly caps for normal use — protective rate &
                        concurrency limits still apply to prevent abuse.
                    </p>
                </div>
            </div>
        </section>
    );
}
