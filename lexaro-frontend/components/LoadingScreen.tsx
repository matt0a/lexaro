"use client";

import { motion } from "framer-motion";
import Image from "next/image";

/**
 * Full-screen loading component with pulsing Lexaro logo.
 */
export default function LoadingScreen() {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
            {/* Subtle background glow */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-[var(--accent)]/10 blur-[100px]" />
            </div>

            {/* Logo container */}
            <motion.div
                className="relative flex flex-col items-center gap-4"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
            >
                {/* Pulsing logo */}
                <motion.div
                    animate={{
                        scale: [1, 1.08, 1],
                        opacity: [0.8, 1, 0.8],
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    className="relative"
                >
                    {/* Glow ring behind logo */}
                    <motion.div
                        className="absolute inset-0 rounded-2xl bg-[var(--accent)]/20 blur-xl"
                        animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.5, 0.2, 0.5],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />

                    {/* Logo image */}
                    <Image
                        src="/logo.png"
                        alt="Lexaro"
                        width={80}
                        height={80}
                        className="relative h-20 w-20 drop-shadow-2xl"
                        priority
                    />
                </motion.div>

                {/* Brand name */}
                <motion.span
                    className="text-xl font-semibold text-white/90"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                >
                    Lexaro
                </motion.span>

                {/* Loading dots */}
                <div className="flex items-center gap-1.5 mt-2">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="h-1.5 w-1.5 rounded-full bg-white/60"
                            animate={{
                                scale: [1, 1.4, 1],
                                opacity: [0.4, 1, 0.4],
                            }}
                            transition={{
                                duration: 0.8,
                                repeat: Infinity,
                                delay: i * 0.15,
                                ease: "easeInOut",
                            }}
                        />
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
