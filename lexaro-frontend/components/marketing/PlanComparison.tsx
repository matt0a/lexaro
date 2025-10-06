// components/marketing/PlanComparison.tsx
import React from "react";

const Row = ({
                 label, free, premium, plus,
             }: {
    label: string;
    free?: boolean | string;
    premium?: boolean | string;
    plus?: boolean | string;
}) => (
    <div className="grid grid-cols-4 items-center border-b border-white/10 px-4 py-3 text-sm">
        <div className="text-gray-300">{label}</div>
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

function Cell({ value }: { value?: boolean | string }) {
    return (
        <div className="flex min-h-[28px] items-center justify-center leading-none">
            {value === true && <Check />}
            {value === false && <Cross />}
            {typeof value === "string" && <span className="text-gray-200">{value}</span>}
            {value === undefined && <span className="text-gray-500">—</span>}
        </div>
    );
}

export default function PlanComparison() {
    return (
        <section className="relative mt-24 overflow-hidden px-4">
            <div className="mx-auto max-w-6xl rounded-3xl border border-white/10 bg-gradient-to-r from-indigo-900/40 via-blue-900/40 to-purple-900/40 p-6 sm:p-8">
                <div className="mb-6 text-center">
                    <h2 className="text-3xl font-bold">Find Your Perfect Plan</h2>
                    <p className="mt-2 text-gray-300">
                        Premium tiers unlock better voices, bigger limits, and priority support.
                    </p>
                </div>

                <div className="grid grid-cols-4 gap-2 border-b border-white/10 px-4 pb-3 text-sm font-semibold">
                    <div />
                    <div className="text-center">Free</div>
                    <div className="text-center">Premium</div>
                    <div className="text-center">Premium+</div>
                </div>

                <Row label="Voices" free="Robotic/basic voices" premium="Natural voices (200+)" plus="Studio & Pro voices" />
                <Row label="Languages" free="Up to 5" premium="60+" plus="60+" />
                <Row label="Offline MP3 download" free={false} premium={true} plus={true} />
                <Row label="Max speed" free="1x" premium="3.5x" plus="10x" />
                <Row label="Monthly words" free="10,000" premium="150,000" plus="350,000" />
                <Row label="Storage" free="5 files" premium="Unlimited" plus="Unlimited" />
                <Row label="Priority support" free="Email" premium="24/7" plus="24/7 VIP" />

                <div className="mt-6 grid grid-cols-4 gap-2 px-4">
                    <div />
                    <a
                        href="#plans"
                        className="mx-auto w-full max-w-xs rounded-xl border border-white/20 px-4 py-2 text-center font-semibold hover:bg-white/5"
                    >
                        Choose Free
                    </a>
                    <a
                        href="#plans"
                        className="mx-auto w-full max-w-xs rounded-xl bg-blue-600 px-4 py-2 text-center font-semibold text-white hover:bg-blue-700"
                    >
                        Start Premium
                    </a>
                    <a
                        href="#plans"
                        className="mx-auto w-full max-w-xs rounded-xl bg-white px-4 py-2 text-center font-semibold text-gray-900 hover:bg-gray-100"
                    >
                        Go Premium+
                    </a>
                </div>
            </div>
        </section>
    );
}
