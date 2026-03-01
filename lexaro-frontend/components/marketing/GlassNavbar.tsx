"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/plans" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
];

export default function GlassNavbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // Close mobile menu on resize
    useEffect(() => {
        const onResize = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    return (
        <>
            <header
                className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
                    scrolled
                        ? "bg-black/70 backdrop-blur-xl border-b border-white/[0.06]"
                        : "bg-transparent"
                }`}
            >
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 md:px-6 py-3">
                    {/* Logo + wordmark */}
                    <Link href="/" className="flex items-center gap-2 font-serif italic text-xl text-white">
                        <Image src="/logo.png" alt="" width={28} height={28} className="h-7 w-7" />
                        Lexaro
                    </Link>

                    {/* Center pill — desktop only */}
                    <nav className="hidden md:flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.04] px-1.5 py-1">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="rounded-full px-3.5 py-1.5 text-sm text-white/70 transition-colors hover:text-white hover:bg-white/[0.06]"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Right side — desktop */}
                    <div className="hidden md:flex items-center gap-2">
                        <Link
                            href="/login"
                            className="rounded-full px-4 py-1.5 text-sm text-white/80 transition-colors hover:text-white hover:bg-white/[0.06]"
                        >
                            Log in
                        </Link>
                        <Link
                            href="/get-started"
                            className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-black transition-opacity hover:opacity-90"
                        >
                            Get Started
                        </Link>
                    </div>

                    {/* Mobile hamburger */}
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="md:hidden flex items-center justify-center h-9 w-9 rounded-full text-white/80 hover:bg-white/[0.06]"
                        aria-label="Toggle menu"
                    >
                        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>
            </header>

            {/* Mobile overlay — always rendered, visibility toggled via opacity + pointer-events */}
            <div
                className={`fixed inset-0 z-40 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center gap-6
                    transition-opacity duration-300 ease-out motion-reduce:transition-none
                    ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
            >
                {NAV_LINKS.map((link, i) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className={`text-2xl font-medium text-white/90 hover:text-white transition-all duration-300 ease-out motion-reduce:transition-none
                            ${mobileOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                        style={{ transitionDelay: mobileOpen ? `${75 + i * 50}ms` : "0ms" }}
                    >
                        {link.label}
                    </Link>
                ))}
                <div
                    className={`mt-4 flex flex-col items-center gap-3 transition-all duration-300 ease-out motion-reduce:transition-none
                        ${mobileOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                    style={{ transitionDelay: mobileOpen ? `${75 + NAV_LINKS.length * 50}ms` : "0ms" }}
                >
                    <Link
                        href="/login"
                        onClick={() => setMobileOpen(false)}
                        className="text-lg text-white/70 hover:text-white"
                    >
                        Log in
                    </Link>
                    <Link
                        href="/get-started"
                        onClick={() => setMobileOpen(false)}
                        className="rounded-full bg-white px-6 py-2.5 text-sm font-medium text-black"
                    >
                        Get Started
                    </Link>
                </div>
            </div>
        </>
    );
}
