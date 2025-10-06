// components/Navbar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";

export default function Navbar() {
    const [open, setOpen] = useState(false);
    const btnRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            if (!open) return;
            const t = e.target as Node;
            if (!btnRef.current?.contains(t) && !menuRef.current?.contains(t)) setOpen(false);
        }
        function onEsc(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
        document.addEventListener("mousedown", onDocClick);
        document.addEventListener("keydown", onEsc);
        return () => {
            document.removeEventListener("mousedown", onDocClick);
            document.removeEventListener("keydown", onEsc);
        };
    }, [open]);

    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/70 backdrop-blur-md">
            <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
                {/* Left: brand */}
                <Link href="/" className="flex items-center gap-2">
                    <Image src="/logo.png" alt="Lexaro" width={22} height={22} className="h-5 w-5" />
                    <span className="text-sm font-semibold text-white">Lexaro</span>
                </Link>

                {/* Center: About dropdown */}
                <div className="relative">
                    <button
                        ref={btnRef}
                        aria-expanded={open}
                        aria-haspopup="menu"
                        onClick={() => setOpen(v => !v)}
                        onMouseEnter={() => setOpen(true)}
                        className="rounded-md px-3 py-1.5 text-sm font-medium text-white/90 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/20"
                    >
                        About
                        <svg aria-hidden className="ml-1 inline h-3 w-3 translate-y-px opacity-80" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z" />
                        </svg>
                    </button>

                    <div
                        ref={menuRef}
                        onMouseLeave={() => setOpen(false)}
                        className={`absolute left-1/2 -translate-x-1/2 pt-2 ${open ? "pointer-events-auto" : "pointer-events-none"}`}
                    >
                        <div
                            role="menu"
                            className={`min-w-[180px] overflow-hidden rounded-xl border border-white/10 bg-[#0b0b0b] shadow-xl transition-all ${open ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"}`}
                        >
                            <Link href="/plans" onClick={() => setOpen(false)} role="menuitem" className="block px-4 py-2.5 text-sm text-white/90 hover:bg-white/5">
                                Pricing
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-2">
                    <Link href="/login" className="rounded-md px-3 py-1.5 text-sm font-medium text-white/80 hover:bg-white/5">Login</Link>
                    <Link href="/get-started" className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700">
                        Try for Free
                    </Link>
                </div>
            </nav>
        </header>
    );
}
