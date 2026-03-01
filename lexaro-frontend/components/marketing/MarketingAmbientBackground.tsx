"use client";

/**
 * MarketingAmbientBackground
 *
 * Fixed full-viewport backdrop for all marketing pages.
 * - Static lighting gradients: ALWAYS rendered (even mobile).
 * - FloatingLinesBackground: desktop only (>=1024px), motion-ok.
 * - If FloatingLines fails: silent fallback (static gradients only).
 *
 * Mounts at z-0 fixed inset-0 pointer-events-none — sits behind
 * everything in MarketingShell.
 */

import React, { useState, useEffect } from "react";
import FloatingLinesBackground from "@/components/reactbits/FloatingLinesBackground";

export default function MarketingAmbientBackground() {
    const [showLines, setShowLines] = useState(false);

    useEffect(() => {
        try {
            /* Gate 1: desktop only (>=1024px) */
            const isDesktop = window.innerWidth >= 1024;
            if (!isDesktop) return;

            /* Gate 2: respect prefers-reduced-motion */
            const motionOk = !window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches;
            if (!motionOk) return;

            setShowLines(true);
        } catch {
            /* Silent fallback */
        }
    }, []);

    return (
        <div
            className="pointer-events-none fixed inset-0 z-0"
            aria-hidden="true"
        >
            {/* Layer: FloatingLinesBackground (desktop, motion-ok only)
                Rendered FIRST so gradient layers sit on top for color control.
                The component has its own bg-black/55 overlay, providing the
                dark base. No extra opacity wrapper — lines stay visible. */}
            {showLines && (
                <div className="fixed inset-0">
                    <FloatingLinesBackground />
                </div>
            )}

            {/* Layer: top aqua glow — bleeds down from top edge */}
            <div
                className="absolute inset-0"
                style={{
                    background:
                        "radial-gradient(ellipse 90% 50% at 50% -5%, rgba(42,252,152,0.14) 0%, transparent 55%)",
                }}
            />

            {/* Layer: subtle blue accent — offset right for depth */}
            <div
                className="absolute inset-0"
                style={{
                    background:
                        "radial-gradient(ellipse 60% 45% at 65% 10%, rgba(77,163,255,0.08) 0%, transparent 60%)",
                }}
            />

            {/* Layer: mid white glow for soft centre lighting */}
            <div
                className="absolute inset-0"
                style={{
                    background:
                        "radial-gradient(ellipse 60% 40% at 50% 40%, rgba(255,255,255,0.05) 0%, transparent 70%)",
                }}
            />

            {/* Layer: vignette — softer dark edges */}
            <div
                className="absolute inset-0"
                style={{
                    background:
                        "radial-gradient(ellipse 75% 65% at 50% 50%, transparent 45%, rgba(0,0,0,0.35) 100%)",
                }}
            />
        </div>
    );
}
