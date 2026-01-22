'use client';

import React from 'react';
import dynamic from 'next/dynamic';

type Props = {
    children: React.ReactNode;
    glow?: 'low' | 'mid' | 'high';
    variant?: 'default' | 'pillars' | 'lines';
    /** extra blur on the background effect layers */
    blur?: 'none' | 'soft' | 'strong';
};

const LightPillarsBackground = dynamic(
    () => import('@/components/reactbits/LightPillarsBackground'),
    { ssr: false, loading: () => null }
);

const FloatingLinesBackground = dynamic(
    () => import('@/components/reactbits/FloatingLinesBackground'),
    { ssr: false, loading: () => null }
);

export default function DashboardScene({
                                           children,
                                           glow = 'mid',
                                           variant = 'pillars',
                                           blur = 'soft',
                                       }: Props) {
    const alpha = glow === 'low' ? 0.08 : glow === 'high' ? 0.16 : 0.12;
    const blurClass =
        blur === 'none' ? '' : blur === 'strong' ? 'blur-[10px]' : 'blur-[6px]';

    return (
        <div className="relative overflow-hidden">
            {/* scene layers (same concept as landing/login) */}
            <div className="pointer-events-none absolute inset-0 -z-10">
                {/* base dot grid + glow */}
                <div className="absolute inset-0 bg-dotgrid opacity-100" />
                <div className="absolute inset-0 bg-center-glow opacity-100" />

                {/* tunable extra accent bloom */}
                <div
                    className="absolute left-1/2 top-1/2 h-[520px] w-[980px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px]"
                    style={{ background: `rgba(34,140,219,${alpha})` }}
                />

                {/* landing-like overlay vignette */}
                <div className="absolute inset-0 bg-vignette-strong opacity-100" />
            </div>

            {/* Landing hero vibe */}
            {variant === 'pillars' && (
                <div className={`pointer-events-none absolute inset-0 -z-10 opacity-[0.9] ${blurClass}`}>
                    <LightPillarsBackground />
                    {/* subtle hero vignette like your landing hero */}
                    <div className="absolute inset-0 bg-hero-overlay" />
                </div>
            )}

            {/* Landing section vibe */}
            {variant === 'lines' && (
                <div className={`pointer-events-none absolute inset-0 -z-10 opacity-[0.9] ${blurClass}`}>
                    <FloatingLinesBackground />
                    <div className="absolute inset-0 bg-lines-overlay" />
                </div>
            )}

            {children}
        </div>
    );
}
