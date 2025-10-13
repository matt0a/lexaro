"use client";

import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CTA from "@/components/CTA";
import FAQ from "@/components/FAQ";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import VoicesShowcase from "@/components/VoicesShowcase";

gsap.registerPlugin(ScrollTrigger);

export default function Page() {
    const heroRef = useRef<HTMLDivElement>(null);
    const sectionsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!heroRef.current || !sectionsRef.current) return;

        // subtle foreground parallax on hero copy
        gsap.to(".hero-fg", {
            yPercent: -4,
            ease: "none",
            scrollTrigger: {
                trigger: heroRef.current,
                start: "top top",
                end: "bottom top",
                scrub: true,
            },
        });

        // reveal sections
        gsap.utils.toArray<HTMLElement>(".reveal").forEach((el, i) => {
            gsap.fromTo(
                el,
                { y: 40, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    ease: "power2.out",
                    duration: 0.9,
                    delay: i * 0.05,
                    scrollTrigger: {
                        trigger: el,
                        start: "top 80%",
                        toggleActions: "play none none reverse",
                    },
                }
            );
        });

        // gentle parallax on feature imagery
        gsap.utils.toArray<HTMLElement>(".parallax").forEach((el) => {
            gsap.to(el, {
                yPercent: -10,
                ease: "none",
                scrollTrigger: {
                    trigger: el,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: true,
                },
            });
        });
    }, []);

    return (
        <main className="bg-black text-white">
            <Navbar />

            {/* HERO */}
            <section
                ref={heroRef}
                className="relative min-h-[88vh] overflow-hidden flex items-center bg-black"
            >
                {/* soft vignettes to lift text */}
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -inset-x-24 -top-1/3 h-[60vh] bg-[radial-gradient(600px_250px_at_50%_0%,rgba(255,255,255,.06),transparent)]" />
                    <div className="absolute -inset-x-24 bottom-0 h-[40vh] bg-[radial-gradient(700px_280px_at_50%_100%,rgba(255,255,255,.05),transparent)]" />
                </div>

                <div className="hero-fg relative z-10 mx-auto max-w-6xl px-6">
                    <p className="kicker text-white/60">LISTEN • TRANSLATE • FOCUS</p>

                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9 }}
                        className="h1 text-white mt-4"
                    >
                        Because Every Page,<br />Deserves a Voice.
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, delay: 0.1 }}
                        className="p mt-6 text-white/80 max-w-2xl"
                    >
                        Experience your content like never before — read aloud, translated
                        into 48 languages, and always within reach.
                    </motion.p>

                    <div className="mt-8 flex gap-3">
                        <motion.a
                            href="/get-started"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.98 }}
                            className="btn-accent"
                        >
                            Try For Free
                        </motion.a>
                        <motion.a
                            href="/login"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.98 }}
                            className="btn-ghost ring-1 ring-white/15 text-white"
                        >
                            Login
                        </motion.a>
                    </div>
                </div>
            </section>

            {/* POPULAR VOICES (right under hero) */}
            <div className="mt-10 sm:mt-12">
                <VoicesShowcase />
            </div>

            {/* CONTENT (black background wrapper so FAQ never appears on white) */}
            <div className="bg-black">
                {/* FEATURES */}
                <div
                    ref={sectionsRef}
                    className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-28 sm:space-y-36 mt-24"
                >
                    {/* Listen Effortlessly */}
                    <section className="grid sm:grid-cols-2 gap-10 items-center reveal">
                        <div>
                            <h2 className="h2">Listen Effortlessly</h2>
                            <p className="mt-3 text-white/70">
                                Turn any document into clear, natural speech. Whether it’s PDFs,
                                notes, or reports, your words flow back to you in a voice you
                                choose.
                            </p>
                        </div>
                        <div className="relative h-72 sm:h-96 rounded-[1.25rem] overflow-hidden card card-hover">
                            <Image
                                src="/images/feature1.jpg"
                                alt="Listen"
                                fill
                                className="object-cover parallax"
                            />
                        </div>
                    </section>

                    {/* Speak the World’s Languages */}
                    <section className="grid sm:grid-cols-2 gap-10 items-center reveal">
                        <div className="relative order-2 sm:order-1 h-72 sm:h-96 rounded-[1.25rem] overflow-hidden card card-hover">
                            <Image
                                src="/images/feature2.jpg"
                                alt="Translate"
                                fill
                                className="object-cover parallax"
                            />
                        </div>
                        <div className="order-1 sm:order-2">
                            <h2 className="h2">Speak the World’s Languages</h2>
                            <p className="mt-3 text-white/70">
                                Translation built in. 48 languages. Unlimited possibilities.
                                Share and understand content across borders with seamless,
                                instant translations.
                            </p>
                        </div>
                    </section>

                    {/* Designed for Focus */}
                    <section className="grid sm:grid-cols-2 gap-10 items-center reveal">
                        <div>
                            <h2 className="h2">Designed for Focus</h2>
                            <p className="mt-3 text-white/70">
                                Minimalist design. Maximum clarity. A distraction-free reading
                                and listening experience, built to keep you immersed in what
                                matters most.
                            </p>
                        </div>
                        <div className="relative h-72 sm:h-96 rounded-[1.25rem] overflow-hidden card card-hover">
                            <Image
                                src="/images/feature3.jpg"
                                alt="Focus"
                                fill
                                className="object-cover parallax"
                            />
                        </div>
                    </section>

                    {/* Intelligent, Personal, Yours */}
                    <section className="grid sm:grid-cols-2 gap-10 items-center reveal">
                        <div className="relative order-2 sm:order-1 h-72 sm:h-96 rounded-[1.25rem] overflow-hidden card card-hover">
                            <Image
                                src="/images/feature4.jpg"
                                alt="Personal"
                                fill
                                className="object-cover parallax"
                            />
                        </div>
                        <div className="order-1 sm:order-2">
                            <h2 className="h2">Intelligent, Personal, Yours</h2>
                            <p className="mt-3 text-white/70">
                                Tailored voices, playback speed, and custom settings. Because
                                your reading experience should sound exactly the way you want it
                                to.
                            </p>
                        </div>
                    </section>

                    <CTA />
                </div>

                {/* FAQ on black background */}
                <div className="mt-24 sm:mt-32 bg-black">
                    <FAQ />
                </div>
            </div>

            <Footer />
        </main>
    );
}
