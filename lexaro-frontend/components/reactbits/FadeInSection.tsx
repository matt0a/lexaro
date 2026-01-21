"use client";

import React from "react";
import { motion, useInView } from "framer-motion";

type Props = {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    once?: boolean;
};

export default function FadeInSection({
                                          children,
                                          className,
                                          delay = 0,
                                          once = true,
                                      }: Props) {
    const ref = React.useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once, margin: "-15% 0px -10% 0px" });

    return (
        <motion.div
            ref={ref}
            className={className}
            initial={{ opacity: 0, y: 18 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
        >
            {children}
        </motion.div>
    );
}
