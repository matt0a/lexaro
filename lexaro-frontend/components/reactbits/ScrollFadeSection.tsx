"use client";

import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";

type Props = {
    children: React.ReactNode;
    className?: string;
};

export default function ScrollFadeSection({ children, className }: Props) {
    const ref = React.useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start 0.85", "end 0.15"],
    });

    // Fade in early, fade out late
    const opacity = useTransform(scrollYProgress, [0, 0.2, 0.75, 1], [0, 1, 1, 0]);
    const y = useTransform(scrollYProgress, [0, 1], [18, -18]);

    return (
        <motion.section ref={ref} style={{ opacity, y }} className={className}>
            {children}
        </motion.section>
    );
}
