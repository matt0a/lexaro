"use client";

import React from "react";

type Props = {
    children: React.ReactNode;
    className?: string;
};

export default function GradientBorderCard({ children, className }: Props) {
    return (
        <div
            className={[
                "relative rounded-[1.25rem] p-[1px]",
                "bg-gradient-to-r from-blue-500/50 via-fuchsia-500/40 to-cyan-400/40",
                className ?? "",
            ].join(" ")}
        >
            <div className="card rounded-[1.2rem]">{children}</div>
        </div>
    );
}
