// components/marketing/GlassCard.tsx
// Reusable card matching the template's glass card style: thin border, transparent bg, hover lift.

import React from "react";

type GlassCardProps = {
    children: React.ReactNode;
    className?: string;
    /** Set false to disable hover lift effect (e.g., for static containers) */
    hoverable?: boolean;
};

export default function GlassCard({
    children,
    className = "",
    hoverable = true,
}: GlassCardProps) {
    return (
        <div
            className={`glass-card ${hoverable ? "" : "hover:translate-y-0 hover:border-white/[0.08] hover:shadow-none"} ${className}`}
        >
            {children}
        </div>
    );
}
