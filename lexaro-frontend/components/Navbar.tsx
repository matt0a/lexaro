'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 4);
        onScroll();
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <header
            className={[
                'fixed inset-x-0 top-0 z-50 transition-all duration-300',
                // glassy black bar; deepen when scrolled
                scrolled
                    ? 'backdrop-blur-md bg-black/70 shadow-[0_2px_30px_rgba(0,0,0,.35)]'
                    : 'backdrop-blur bg-black/50',
                'border-b border-white/10',
            ].join(' ')}
        >
            {/* blue tint overlay */}
            <div
                className="pointer-events-none absolute inset-0 opacity-100"
                style={{
                    background:
                        'linear-gradient(180deg, rgba(34,140,219,.16), rgba(34,140,219,0) 85%)',
                }}
            />

            <nav className="relative section h-14 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3 text-white">
                    <Image
                        src="/logo.png"
                        alt="Lexaro logo"
                        width={28}
                        height={28}
                        priority
                        className="rounded-[8px] drop-shadow-[0_4px_12px_rgba(34,140,219,.35)]"
                    />
                    <span className="text-lg font-semibold tracking-tight">Lexaro</span>
                </Link>

                <div className="flex items-center gap-2">
                    <Link href="/login" className="btn-ghost">
                        Login
                    </Link>
                    <Link href="/signup" className="btn btn-accent">
                        Get Started
                    </Link>
                </div>
            </nav>
        </header>
    );
}
