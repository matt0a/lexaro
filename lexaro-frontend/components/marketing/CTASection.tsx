// components/marketing/CTASection.tsx
// Template-style CTA: italic kicker, large heading, subtitle, bordered button.

import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import AccentHeading from "./AccentHeading";

export default function CTASection() {
    return (
        <section className="py-24 text-center">
            <div className="mx-auto max-w-2xl px-4">
                {/* Kicker with accent line */}
                <p className="font-serif italic text-sm text-white/50 mb-6">
                    Reach out anytime
                </p>

                <AccentHeading
                    as="h2"
                    className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white leading-tight mb-4"
                >
                    {"Ready to Study Smarter? Let's *Start Today*"}
                </AccentHeading>

                <p className="text-white/50 mb-8">
                    Try Lexaro free — no credit card required.
                </p>

                <Link
                    href="/get-started"
                    className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/[0.08]"
                >
                    Get Started Free
                    <ArrowUpRight className="h-4 w-4" />
                </Link>
            </div>
        </section>
    );
}
