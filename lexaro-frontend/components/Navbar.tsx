"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Menu, X } from "lucide-react";

function cn(...classes: Array<string | undefined | false | null>) {
    return classes.filter(Boolean).join(" ");
}

// ✅ Your screenshot shows: public/logo.png
const LOGO_SRC = "/logo.png";

export default function Navbar() {
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const [aboutOpen, setAboutOpen] = React.useState(false);

    const aboutRef = React.useRef<HTMLDivElement | null>(null);

    // close dropdown on outside click + esc
    React.useEffect(() => {
        function onDown(e: MouseEvent) {
            if (!aboutRef.current) return;
            if (!aboutRef.current.contains(e.target as Node)) setAboutOpen(false);
        }
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") setAboutOpen(false);
        }
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, []);

    React.useEffect(() => {
        if (!mobileOpen) setAboutOpen(false);
    }, [mobileOpen]);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
            <div className="mx-auto max-w-6xl px-4 md:px-6 h-16 flex items-center justify-between">
                {/* Brand */}
                <Link href="/" className="inline-flex items-center gap-2">
          <span className="relative h-7 w-7">
            <Image
                src={LOGO_SRC}
                alt="Lexaro logo"
                fill
                priority
                className="object-contain"
            />
          </span>
                    <span className="font-semibold tracking-tight text-white">Lexaro</span>
                </Link>

                {/* Desktop nav */}
                <nav className="hidden md:flex items-center gap-6 text-sm">
                    <Link href="/get-started" className="text-white/75 hover:text-white">
                        Get started
                    </Link>

                    {/* ✅ About dropdown (hover + click, stable hover to menu) */}
                    <div ref={aboutRef} className="relative group">
                        <button
                            type="button"
                            onClick={() => setAboutOpen((v) => !v)}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/85 hover:text-white hover:bg-white/10 transition"
                            aria-haspopup="menu"
                            aria-expanded={aboutOpen}
                        >
                            About{" "}
                            <ChevronDown
                                className={cn(
                                    "h-4 w-4 transition",
                                    (aboutOpen ? "rotate-180" : ""),
                                    "group-hover:rotate-180"
                                )}
                            />
                        </button>

                        <div
                            role="menu"
                            className={cn(
                                "absolute right-0 mt-2 w-44 overflow-hidden rounded-2xl border border-white/10 bg-black/90 shadow-[0_20px_80px_rgba(0,0,0,.8)] backdrop-blur-md",
                                "transition",
                                // ✅ show if either state open OR hover on group
                                (aboutOpen
                                    ? "opacity-100 translate-y-0 pointer-events-auto"
                                    : "opacity-0 -translate-y-1 pointer-events-none"),
                                "group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto"
                            )}
                        >
                            <Link
                                role="menuitem"
                                href="/about/features"
                                className="block px-4 py-3 text-white/80 hover:text-white hover:bg-white/10"
                                onClick={() => setAboutOpen(false)}
                            >
                                Features
                            </Link>

                            <Link
                                role="menuitem"
                                href="/plans"
                                className="block px-4 py-3 text-white/80 hover:text-white hover:bg-white/10"
                                onClick={() => setAboutOpen(false)}
                            >
                                Pricing
                            </Link>
                        </div>
                    </div>
                </nav>

                {/* Mobile toggle */}
                <button
                    type="button"
                    className="md:hidden inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-white/85 hover:text-white hover:bg-white/10 transition"
                    onClick={() => setMobileOpen((v) => !v)}
                    aria-label="Toggle menu"
                    aria-expanded={mobileOpen}
                >
                    {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </div>

            {/* Mobile panel */}
            <div
                className={cn(
                    "md:hidden border-t border-white/10 bg-black/70 backdrop-blur-md",
                    mobileOpen ? "block" : "hidden"
                )}
            >
                <div className="mx-auto max-w-6xl px-4 py-4 space-y-2">
                    <Link
                        href="/get-started"
                        className="block rounded-xl px-3 py-2 text-white/80 hover:text-white hover:bg-white/10"
                        onClick={() => setMobileOpen(false)}
                    >
                        Get started
                    </Link>

                    {/* Mobile About accordion */}
                    <button
                        type="button"
                        onClick={() => setAboutOpen((v) => !v)}
                        className="w-full inline-flex items-center justify-between rounded-xl px-3 py-2 text-white/80 hover:text-white hover:bg-white/10"
                        aria-expanded={aboutOpen}
                    >
                        <span>About</span>
                        <ChevronDown className={cn("h-4 w-4 transition", aboutOpen && "rotate-180")} />
                    </button>

                    {aboutOpen ? (
                        <div className="pl-3 space-y-1">
                            <Link
                                href="/about/features"
                                className="block rounded-xl px-3 py-2 text-white/75 hover:text-white hover:bg-white/10"
                                onClick={() => setMobileOpen(false)}
                            >
                                Features
                            </Link>

                            <Link
                                href="/plans"
                                className="block rounded-xl px-3 py-2 text-white/75 hover:text-white hover:bg-white/10"
                                onClick={() => setMobileOpen(false)}
                            >
                                Pricing
                            </Link>
                        </div>
                    ) : null}
                </div>
            </div>
        </header>
    );
}
