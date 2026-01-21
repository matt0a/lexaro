"use client";

import React from "react";
import { motion } from "framer-motion";

type Props = {
    className?: string;
};

export default function AnimatedGrid({ className }: Props) {
    return (
        <div className={["pointer-events-none absolute inset-0", className ?? ""].join(" ")}>
            {/* Grid */}
            <div className="absolute inset-0 opacity-[0.25] [background-image:linear-gradient(to_right,rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black_45%,transparent_80%)]" />

            {/* Moving spotlight */}
            <motion.div
                className="absolute inset-0"
                animate={{
                    background: [
                        "radial-gradient(550px 260px at 15% 20%, rgba(34,140,219,.16), transparent 60%)",
                        "radial-gradient(550px 260px at 85% 25%, rgba(34,140,219,.16), transparent 60%)",
                        "radial-gradient(550px 260px at 40% 75%, rgba(34,140,219,.14), transparent 60%)",
                        "radial-gradient(550px 260px at 15% 20%, rgba(34,140,219,.16), transparent 60%)",
                    ],
                }}
                transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            />
        </div>
    );
}
