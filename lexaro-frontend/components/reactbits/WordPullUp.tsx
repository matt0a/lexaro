"use client";

import React from "react";
import { motion } from "framer-motion";

type Props = {
    text: string;
    className?: string;
    delay?: number;
};

export default function WordPullUp({ text, className, delay = 0 }: Props) {
    const words = text.split(" ");

    return (
        <h1 className={className}>
            {words.map((w, i) => (
                <motion.span
                    key={`${w}-${i}`}
                    className="inline-block will-change-transform"
                    initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{
                        duration: 0.55,
                        ease: "easeOut",
                        delay: delay + i * 0.04,
                    }}
                >
                    {w}
                    {i < words.length - 1 ? "\u00A0" : ""}
                </motion.span>
            ))}
        </h1>
    );
}
