'use client';

import React from 'react';

type Props = {
    children: React.ReactNode;
};

export default function SiteScene({ children }: Props) {
    return (
        <div className="relative overflow-hidden">
            {/* same layered background concept as landing/login */}
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-dotgrid" />
                <div className="absolute inset-0 bg-center-glow" />
                <div className="absolute inset-0 bg-vignette-strong" />
            </div>

            {children}
        </div>
    );
}
