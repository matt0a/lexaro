"use client";

import React from "react";
import { motion } from "framer-motion";

type Props = {
    className?: string;
};

export default function LightPillarsBackground({ className }: Props) {
    return (
        <div className={["pointer-events-none absolute inset-0 overflow-hidden", className ?? ""].join(" ")}>
            {/* soft top glow */}
            <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_50%_0%,rgba(255,255,255,.10),transparent_60%)]" />

            {/* pillars */}
            <div className="absolute inset-0">
                {Array.from({ length: 7 }).map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute bottom-[-20%] top-[-20%] w-[10rem] blur-2xl"
                        style={{
                            left: `${8 + i * 13}%`,
                            background:
                                "linear-gradient(to top, rgba(56,189,248,.0), rgba(56,189,248,.22), rgba(168,85,247,.18), rgba(34,211,238,.14), rgba(255,255,255,.06))",
                            transform: `skewX(${i % 2 === 0 ? -10 : 10}deg)`,
                            borderRadius: "999px",
                            opacity: 0.9,
                        }}
                        animate={{ y: [0, -35, 0], opacity: [0.65, 0.95, 0.65] }}
                        transition={{
                            duration: 6 + i * 0.6,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.2,
                        }}
                    />
                ))}
            </div>

            {/* vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_50%_100%,rgba(0,0,0,.40),transparent_70%)]" />
            <div className="absolute inset-0 bg-black/35" />

            {/* tiny grain */}
            <div className="absolute inset-0 opacity-[0.09] [background-image:radial-gradient(rgba(255,255,255,.55)_1px,transparent_1px)] [background-size:18px_18px]" />
        </div>
    );
}
