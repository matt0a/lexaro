import React from "react";

type Tone = "violet" | "blue" | "aqua";

export default function FluidGlassSection({
                                              children,
                                              tone = "violet",
                                          }: {
    children: React.ReactNode;
    tone?: Tone;
}) {
    const toneClass =
        tone === "blue"
            ? "bg-[radial-gradient(60%_60%_at_50%_0%,rgba(0,159,253,0.18)_0%,rgba(0,0,0,0)_70%)]"
            : tone === "aqua"
                ? "bg-[radial-gradient(60%_60%_at_50%_0%,rgba(42,252,152,0.16)_0%,rgba(0,0,0,0)_70%)]"
                : "bg-[radial-gradient(60%_60%_at_50%_0%,rgba(147,51,234,0.18)_0%,rgba(0,0,0,0)_70%)]";

    return (
        <section className="relative overflow-hidden">
            {/* glow */}
            <div className={`pointer-events-none absolute inset-0 ${toneClass}`} />

            {/* soft noise-ish overlay */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:radial-gradient(rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:22px_22px]" />

            {/* content */}
            <div className="relative z-10">{children}</div>
        </section>
    );
}
