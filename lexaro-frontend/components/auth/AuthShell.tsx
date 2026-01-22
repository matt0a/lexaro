'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import LightPillarsBackground from '@/components/reactbits/LightPillarsBackground';
import StarBorderCard from '@/components/reactbits/StarBorderCard';

type AuthShellProps = {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
};

export default function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
    return (
        <main className="min-h-screen bg-black text-white">
            <Navbar />

            <section className="relative min-h-[calc(100vh-64px)] overflow-hidden flex items-center">
                <LightPillarsBackground />

                {/* subtle vignette like landing hero */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/45" />

                <div className="relative z-10 w-full px-4">
                    <div className="mx-auto w-full max-w-md">
                        <StarBorderCard as="div" thickness={1} speed="7s" color="var(--accent)">
                            <div className="p-7">
                                <h1 className="text-2xl md:text-3xl font-semibold">{title}</h1>
                                {subtitle ? <p className="mt-2 text-sm text-white/70">{subtitle}</p> : null}
                                <div className="mt-6">{children}</div>
                                {footer ? <div className="mt-5 text-sm text-white/80">{footer}</div> : null}
                            </div>
                        </StarBorderCard>
                    </div>
                </div>
            </section>
        </main>
    );
}
