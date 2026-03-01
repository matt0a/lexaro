// components/marketing/MarketingShell.tsx
// Layout wrapper that scopes marketing styles.
// Layers: z-0 ambient background → z-[2] noise → z-10 page content.
// Does NOT add opaque backgrounds that would hide per-section video loops.

import React from "react";
import MarketingAmbientBackground from "./MarketingAmbientBackground";

export default function MarketingShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="marketing-root relative overflow-hidden">
            {/* z-0: Ambient background (plasma + lighting gradients) */}
            <MarketingAmbientBackground />

            {/* z-[2]: Noise layer — low-opacity dot pattern for texture */}
            <div
                className="pointer-events-none fixed inset-0 z-[4] opacity-[0.03]"
                aria-hidden="true"
                style={{
                    backgroundImage:
                        "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
                    backgroundSize: "3px 3px",
                }}
            />

            {/* z-10: All page content (sections with video loops create their own stacking contexts) */}
            <div className="relative z-10">{children}</div>
        </div>
    );
}
