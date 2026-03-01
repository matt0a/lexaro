// components/marketing/SectionPill.tsx
// Small uppercase pill label placed above section headings. Matches template style.

import React from "react";

type SectionPillProps = {
    icon?: React.ReactNode;
    children: React.ReactNode;
};

export default function SectionPill({ icon, children }: SectionPillProps) {
    return (
        <span className="section-pill">
            {icon && <span className="h-3.5 w-3.5 opacity-60">{icon}</span>}
            {children}
        </span>
    );
}
