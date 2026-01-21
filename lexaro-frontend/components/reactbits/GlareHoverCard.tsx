"use client";

import React from "react";

type Props = {
    children: React.ReactNode;
    className?: string;
};

export default function GlareHoverCard({ children, className }: Props) {
    const ref = React.useRef<HTMLDivElement>(null);

    const onMove = (e: React.MouseEvent) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * 100;
        const y = ((e.clientY - r.top) / r.height) * 100;
        el.style.setProperty("--gx", `${x}%`);
        el.style.setProperty("--gy", `${y}%`);
    };

    return (
        <div
            ref={ref}
            onMouseMove={onMove}
            className={[
                "relative rounded-2xl border border-white/10 bg-white/5 p-6",
                "transition-transform duration-200 hover:-translate-y-1",
                className ?? "",
            ].join(" ")}
            style={
                {
                    "--gx": "50%",
                    "--gy": "30%",
                } as React.CSSProperties
            }
        >
            {/* glare */}
            <div
                className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-200 hover:opacity-100"
                style={{
                    background:
                        "radial-gradient(420px 240px at var(--gx) var(--gy), rgba(255,255,255,.22), transparent 60%)",
                }}
            />
            {/* subtle inner */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl [box-shadow:inset_0_1px_0_rgba(255,255,255,.08)]" />
            <div className="relative z-10">{children}</div>
        </div>
    );
}
