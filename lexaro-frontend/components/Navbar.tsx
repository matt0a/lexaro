"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown } from "lucide-react";

function cn(...classes: Array<string | undefined | false | null>) {
    return classes.filter(Boolean).join(" ");
}

const LOGO_SRC = "/logo.png";

export default function Navbar() {
    const [open, setOpen] = useState(false);
    const [aboutOpen, setAboutOpen] = useState(false);
    const aboutRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (!aboutRef.current) return;
            if (!aboutRef.current.contains(e.target as Node)) setAboutOpen(false);
        };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, []);

    return (
        <header className="sticky top-0 z-50 border-b border-white/10 bg-black/65 backdrop-blur-xl">
            <div className="mx-auto max-w-6xl px-4 md:px-6">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo (acts as Home) */}
                    <Link href="/" className="flex items-center gap-2">
                        <Image
                            src={LOGO_SRC}
                            alt="Lexaro"
                            width={24}
                            height={24}
                            priority
                            className="h-6 w-6 object-contain"
                        />
                        <span className="text-lg font-semibold tracking-tight">Lexaro</span>
                    </Link>

                    {/* Desktop nav */}
                    <nav className="hidden md:flex items-center gap-2">
                        <Link
                            href="/about/features" // ✅ your real features route
                            className="rounded-xl px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5"
                        >
                            Features
                        </Link>

                        <Link
                            href="/plans"
                            className="rounded-xl px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5"
                        >
                            Pricing
                        </Link>

                        {/* About dropdown */}
                        <div className="relative" ref={aboutRef}>
                            <button
                                type="button"
                                onClick={() => setAboutOpen((v) => !v)}
                                className={cn(
                                    "inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm",
                                    "text-white/80 hover:text-white hover:bg-white/5",
                                    aboutOpen && "bg-white/5 text-white"
                                )}
                            >
                                About
                                <ChevronDown className="h-4 w-4 opacity-80" />
                            </button>

                            {aboutOpen ? (
                                <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl shadow-xl">
                                    <Link
                                        href="/about"
                                        className="block px-4 py-3 text-sm text-white/80 hover:bg-white/5 hover:text-white"
                                        onClick={() => setAboutOpen(false)}
                                    >
                                        About Lexaro
                                    </Link>
                                    <Link
                                        href="/contact"
                                        className="block px-4 py-3 text-sm text-white/80 hover:bg-white/5 hover:text-white"
                                        onClick={() => setAboutOpen(false)}
                                    >
                                        Contact
                                    </Link>
                                </div>
                            ) : null}
                        </div>

                        {/* Login */}
                        <Link
                            href="/login"
                            className={cn(
                                "ml-2 inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium",
                                "border border-white/10 bg-white/5 text-white/90",
                                "hover:bg-white/10 hover:text-white"
                            )}
                        >
                            Login
                        </Link>

                        {/* Get started */}
                        <Link
                            href="/get-started"
                            className={cn(
                                "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium",
                                "bg-white text-black hover:bg-white/90"
                            )}
                        >
                            Get started
                        </Link>
                    </nav>

                    {/* Mobile button */}
                    <button
                        className="md:hidden rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 hover:bg-white/10"
                        onClick={() => setOpen((v) => !v)}
                        aria-label="Open menu"
                    >
                        Menu
                    </button>
                </div>

                {/* Mobile menu */}
                {open ? (
                    <div className="md:hidden pb-4">
                        <div className="mt-2 grid gap-2 rounded-2xl border border-white/10 bg-black/60 p-3">
                            <Link
                                href="/about/features" // ✅ your real features route
                                className="rounded-xl px-3 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white"
                                onClick={() => setOpen(false)}
                            >
                                Features
                            </Link>

                            <Link
                                href="/plans"
                                className="rounded-xl px-3 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white"
                                onClick={() => setOpen(false)}
                            >
                                Pricing
                            </Link>

                            <Link
                                href="/about"
                                className="rounded-xl px-3 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white"
                                onClick={() => setOpen(false)}
                            >
                                About Lexaro
                            </Link>

                            <Link
                                href="/contact"
                                className="rounded-xl px-3 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white"
                                onClick={() => setOpen(false)}
                            >
                                Contact
                            </Link>

                            <Link
                                href="/login"
                                className="mt-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 hover:bg-white/10"
                                onClick={() => setOpen(false)}
                            >
                                Login
                            </Link>

                            <Link
                                href="/get-started"
                                className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-black hover:bg-white/90"
                                onClick={() => setOpen(false)}
                            >
                                Get started
                            </Link>
                        </div>
                    </div>
                ) : null}
            </div>
        </header>
    );
}
