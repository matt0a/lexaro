"use client";

import React from "react";

type Props = {
    children: React.ReactNode;
    className?: string;
    tone?: "blue" | "violet";
};

export default function FluidGlassSection({ children, className, tone = "blue" }: Props) {
    const bg =
        tone === "blue"
            ? "bg-[radial-gradient(1200px_500px_at_50%_0%,rgba(56,189,248,.22),transparent_60%),radial-gradient(900px_500px_at_10%_80%,rgba(34,211,238,.14),transparent_60%)]"
            : "bg-[radial-gradient(1200px_500px_at_50%_0%,rgba(168,85,247,.22),transparent_60%),radial-gradient(900px_500px_at_90%_80%,rgba(56,189,248,.12),transparent_60%)]";

    return (
        <section className={["relative", className ?? ""].join(" ")}>
            {/* black behind */}
            <div className="absolute inset-0 bg-black" />

            {/* colored glass band */}
            <div className={["absolute inset-0", bg].join(" ")} />

            {/* glass overlay */}
            <div className="absolute inset-0 bg-white/5 backdrop-blur-xl" />

            {/* border edges */}
            <div className="absolute inset-0 border-y border-white/10" />

            <div className="relative z-10">{children}</div>
        </section>
    );
}
