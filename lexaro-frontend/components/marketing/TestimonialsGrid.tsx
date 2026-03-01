// components/marketing/TestimonialsGrid.tsx
"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Star } from "lucide-react";
import { TESTIMONIALS } from "@/lib/marketing-data";

type Props = {
    /** Enable horizontal scroll-snap slider instead of grid */
    slider?: boolean;
    /** Enable auto-scrolling marquee loop (ignores slider prop) */
    loop?: boolean;
    /** Override which testimonials to display (defaults to all) */
    items?: typeof TESTIMONIALS;
};

export default function TestimonialsGrid({ slider = false, loop = false, items }: Props) {
    const testimonials = items ?? TESTIMONIALS;
    const scrollRef = useRef<HTMLDivElement>(null);
    const [activeDot, setActiveDot] = useState(0);
    const cardCount = testimonials.length;

    // Track active card in slider mode via IntersectionObserver
    useEffect(() => {
        if (!slider || !scrollRef.current) return;
        const cards = scrollRef.current.querySelectorAll("[data-card]");
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        const idx = Number((entry.target as HTMLElement).dataset.card);
                        if (!isNaN(idx)) setActiveDot(idx);
                    }
                }
            },
            { root: scrollRef.current, threshold: 0.6 }
        );
        cards.forEach((card) => observer.observe(card));
        return () => observer.disconnect();
    }, [slider]);

    const scrollTo = useCallback((idx: number) => {
        if (!scrollRef.current) return;
        const cards = scrollRef.current.querySelectorAll("[data-card]");
        cards[idx]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }, []);

    // Auto-scrolling infinite marquee — renders cards twice for seamless loop
    if (loop) {
        return (
            <div className="overflow-hidden w-full">
                <div className="flex marquee-track gap-4">
                    {/* Duplicate set A + set B so the loop is seamless */}
                    {[...testimonials, ...testimonials].map((t, i) => (
                        <div key={i} className="flex-shrink-0 w-[300px] md:w-[380px]">
                            <TestimonialCard testimonial={t} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (slider) {
        return (
            <div>
                <div
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4"
                    style={{ scrollbarWidth: "none" }}
                >
                    {testimonials.map((t, i) => (
                        <div
                            key={t.id}
                            data-card={i}
                            className="flex-shrink-0 w-[300px] md:w-[340px] snap-center"
                        >
                            <TestimonialCard testimonial={t} />
                        </div>
                    ))}
                </div>
                {/* Dots */}
                <div className="flex justify-center gap-1.5 mt-4">
                    {Array.from({ length: cardCount }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => scrollTo(i)}
                            className={`h-1.5 rounded-full transition-all ${
                                activeDot === i ? "w-6 bg-white/60" : "w-1.5 bg-white/20"
                            }`}
                            aria-label={`Go to testimonial ${i + 1}`}
                        />
                    ))}
                </div>
            </div>
        );
    }

    // Default: static grid
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.slice(0, 6).map((t) => (
                <TestimonialCard key={t.id} testimonial={t} />
            ))}
        </div>
    );
}

function TestimonialCard({ testimonial }: { testimonial: (typeof TESTIMONIALS)[number] }) {
    // Generate initials for avatar placeholder
    const initials = testimonial.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2);

    return (
        <div className="glass-card p-5">
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-xs font-medium text-white/60">
                    {initials}
                </div>
                <div>
                    <div className="text-sm font-medium text-white">{testimonial.name}</div>
                    <div className="text-xs text-white/40">{testimonial.role}</div>
                </div>
            </div>
            {/* Stars */}
            <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${
                            i < testimonial.rating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-white/15"
                        }`}
                    />
                ))}
            </div>
            {/* Quote */}
            <p className="text-sm text-white/60 leading-relaxed">
                &ldquo;{testimonial.text}&rdquo;
            </p>
        </div>
    );
}
