// components/marketing/ComparisonBlock.tsx
// Us vs Others comparison. Monochrome only — no accent colors on icons.

import React from "react";
import { Check, X } from "lucide-react";
import { COMPARISON_ROWS } from "@/lib/marketing-data";

export default function ComparisonBlock() {
    return (
        <div className="grid gap-6 md:grid-cols-2">
            {/* Lexaro column */}
            <div>
                <div className="mb-4 flex items-center gap-2">
                    <span className="font-serif italic text-lg text-white">Lexaro</span>
                </div>
                <div className="glass-card p-1">
                    {COMPARISON_ROWS.map((row, i) => (
                        <div
                            key={i}
                            className="flex items-start gap-3 px-5 py-4 border-b border-white/[0.04] last:border-0"
                        >
                            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-white/80" />
                            <span className="text-sm text-white/80">{row.lexaro}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Others column */}
            <div>
                <div className="mb-4 flex items-center gap-2">
                    <span className="font-serif italic text-lg text-white/50">Others</span>
                </div>
                <div className="glass-card p-1">
                    {COMPARISON_ROWS.map((row, i) => (
                        <div
                            key={i}
                            className="flex items-start gap-3 px-5 py-4 border-b border-white/[0.04] last:border-0"
                        >
                            <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-white/30" />
                            <span className="text-sm text-white/40">{row.others}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
