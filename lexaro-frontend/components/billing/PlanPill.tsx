import React from "react";

export default function PlanPill({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium">
      {children}
    </span>
    );
}
