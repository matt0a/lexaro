// components/marketing/ProcessSteps.tsx
// Three-step process: Upload → Study → Improve. Matches template Screenshot6.

import React from "react";
import { PROCESS_STEPS } from "@/lib/marketing-data";

export default function ProcessSteps() {
    return (
        <div className="grid gap-6 md:grid-cols-3">
            {PROCESS_STEPS.map((step) => (
                <div key={step.number} className="glass-card relative overflow-hidden p-6">
                    {/* Large faded step number */}
                    <span className="absolute -top-2 -left-1 text-7xl font-bold text-white/[0.04] leading-none select-none">
                        {step.number}
                    </span>
                    {/* Step label */}
                    <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-white/40 mb-2">
                        Step {step.number}
                    </p>
                    <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                    <p className="text-sm text-white/50 leading-relaxed">{step.description}</p>
                </div>
            ))}
        </div>
    );
}
