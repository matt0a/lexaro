"use client";

import React from "react";
import { motion } from "framer-motion";

type Props = {
    className?: string;
};

export default function FloatingLinesBackground({ className }: Props) {
    return (
        <div className={["pointer-events-none absolute inset-0 overflow-hidden", className ?? ""].join(" ")}>
            <div className="absolute inset-0 bg-[radial-gradient(800px_420px_at_50%_0%,rgba(56,189,248,.08),transparent_65%)]" />

            <motion.svg
                className="absolute inset-0 h-full w-full opacity-60"
                viewBox="0 0 1200 600"
                preserveAspectRatio="none"
                initial={{ y: 0 }}
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            >
                {Array.from({ length: 14 }).map((_, i) => (
                    <motion.path
                        key={i}
                        d={`M -100 ${40 + i * 40} C 200 ${20 + i * 40}, 500 ${70 + i * 40}, 1300 ${40 + i * 40}`}
                        fill="none"
                        stroke="rgba(255,255,255,0.12)"
                        strokeWidth="1"
                        initial={{ pathLength: 0.35, opacity: 0.15 }}
                        animate={{ pathLength: [0.35, 1, 0.35], opacity: [0.1, 0.22, 0.1] }}
                        transition={{ duration: 9 + i * 0.25, repeat: Infinity, ease: "easeInOut", delay: i * 0.08 }}
                    />
                ))}
            </motion.svg>

            <div className="absolute inset-0 bg-black/55" />
        </div>
    );
}
