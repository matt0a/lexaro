"use client";

import React from "react";
import { motion } from "framer-motion";

type Props = {
    children: React.ReactNode;
    className?: string;
};

export default function AuroraBackground({ children, className }: Props) {
    return (
        <div className={["relative overflow-hidden", className ?? ""].join(" ")}>
            {/* Animated aurora blobs */}
            <div className="pointer-events-none absolute inset-0">
                <motion.div
                    className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-blue-500/20 blur-3xl mix-blend-screen"
                    animate={{ x: [0, 60, -20, 0], y: [0, 30, 10, 0], scale: [1, 1.08, 0.98, 1] }}
                    transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute -right-48 -top-24 h-[560px] w-[560px] rounded-full bg-fuchsia-500/18 blur-3xl mix-blend-screen"
                    animate={{ x: [0, -70, 20, 0], y: [0, 40, -10, 0], scale: [1, 1.06, 1, 1] }}
                    transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute left-1/4 -bottom-56 h-[620px] w-[620px] rounded-full bg-cyan-400/16 blur-3xl mix-blend-screen"
                    animate={{ x: [0, 40, -30, 0], y: [0, -40, -10, 0], scale: [1, 1.1, 0.98, 1] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Soft vignette */}
                <div className="absolute inset-0 bg-[radial-gradient(800px_400px_at_50%_0%,rgba(255,255,255,.06),transparent)]" />
                <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_50%_100%,rgba(255,255,255,.05),transparent)]" />

                {/* Grain-ish overlay (cheap + effective) */}
                <div className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(rgba(255,255,255,.55)_1px,transparent_1px)] [background-size:18px_18px]" />
            </div>

            <div className="relative z-10">{children}</div>
        </div>
    );
}
