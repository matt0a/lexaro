"use client";

import React from "react";
import { motion } from "framer-motion";

type Props = {
    children: React.ReactNode;
    className?: string;
    alwaysAnimate?: boolean;
    speed?: number;
};

export default function StarBorderCard({
                                           children,
                                           className,
                                           alwaysAnimate = false,
                                           speed = 12,
                                       }: Props) {
    return (
        <div className={["relative rounded-3xl p-[1px] overflow-hidden", className ?? ""].join(" ")}>
            {/* Animated border ring */}
            <motion.div
                className="absolute inset-0"
                animate={alwaysAnimate ? { rotate: 360 } : undefined}
                transition={alwaysAnimate ? { duration: speed, ease: "linear", repeat: Infinity } : undefined}
            >
                {/* tighter ring (less bloom) */}
                <div className="absolute -inset-24 opacity-55">
                    <div className="absolute inset-0 bg-[conic-gradient(from_0deg,rgba(56,189,248,.85),rgba(167,139,250,.75),rgba(34,211,238,.75),rgba(244,114,182,.55),rgba(56,189,248,.85))]" />
                </div>

                {/* faint glow only */}
                <div className="absolute -inset-24 bg-[radial-gradient(circle,rgba(56,189,248,.16),transparent_62%)] blur-3xl" />
            </motion.div>

            {/* INNER SURFACE: much darker */}
            <div className="relative rounded-3xl border border-white/10 bg-black/70 backdrop-blur-md shadow-[0_28px_90px_rgba(0,0,0,.75)]">
                <div className="pointer-events-none absolute inset-0 rounded-3xl [box-shadow:inset_0_1px_0_rgba(255,255,255,.06)]" />
                {children}
            </div>
        </div>
    );
}
