"use client";

import React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

type Props = Omit<HTMLMotionProps<"a">, "children"> & {
    variant?: "primary" | "ghost";
    children: React.ReactNode; // force normal React children
};

export default function ShimmerButton({
                                          variant = "primary",
                                          className,
                                          children,
                                          ...props
                                      }: Props) {
    const base =
        variant === "primary"
            ? "btn-accent relative overflow-hidden inline-flex items-center justify-center gap-2"
            : "btn-ghost relative overflow-hidden inline-flex items-center justify-center gap-2 ring-1 ring-white/15 text-white";

    return (
        <motion.a
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className={[base, className ?? ""].join(" ")}
            {...props}
        >
            {/* shimmer */}
            <span className="pointer-events-none absolute inset-0 opacity-0 hover:opacity-100 transition-opacity">
        <span className="absolute -left-1/3 top-0 h-full w-1/2 rotate-12 bg-gradient-to-r from-transparent via-white/20 to-transparent blur-md" />
      </span>

            {/* content */}
            <span className="relative z-10">{children}</span>
        </motion.a>
    );
}
