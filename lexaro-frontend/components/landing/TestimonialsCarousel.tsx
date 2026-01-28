"use client";

import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";
import FadeInSection from "@/components/reactbits/FadeInSection";

/**
 * Testimonial data type.
 */
type Testimonial = {
    id: number;
    name: string;
    role: string;
    rating: number;
    text: string;
};

/**
 * Sample testimonials data (placeholder - replace with real reviews later).
 */
const TESTIMONIALS: Testimonial[] = [
    {
        id: 1,
        name: "Sarah Chen",
        role: "Medical Student, Johns Hopkins",
        rating: 5,
        text: "Lexaro completely changed how I study for boards. The citation feature means I can trust the answers, and the quiz generator saves me hours of prep time.",
    },
    {
        id: 2,
        name: "Marcus Johnson",
        role: "Law Student, NYU",
        rating: 5,
        text: "Finally, an AI tool that actually understands legal documents. The flashcard generation from my case briefs is incredibly accurate.",
    },
    {
        id: 3,
        name: "Emily Rodriguez",
        role: "Engineering Student, MIT",
        rating: 5,
        text: "I use the voice feature during my commute and the Learn features at night. My grades have improved significantly since I started using Lexaro.",
    },
    {
        id: 4,
        name: "David Kim",
        role: "Pre-Med, Stanford",
        rating: 5,
        text: "The progress tracking and weak topic alerts are game changers. I know exactly what to focus on before each exam.",
    },
    {
        id: 5,
        name: "Aisha Patel",
        role: "MBA Student, Wharton",
        rating: 5,
        text: "Clean, fast, and actually useful. The essay grading feature helped me improve my writing for case competitions.",
    },
    {
        id: 6,
        name: "James Wilson",
        role: "PhD Candidate, Berkeley",
        rating: 5,
        text: "Reading papers is so much easier with Lexaro Voice. I can listen while taking notes and the audio quality is surprisingly natural.",
    },
    {
        id: 7,
        name: "Lisa Thompson",
        role: "Nursing Student, UCLA",
        rating: 5,
        text: "The study loop approach actually works. Quiz myself, see what I missed, review those topics. My retention has never been better.",
    },
    {
        id: 8,
        name: "Ryan O'Connor",
        role: "Finance Major, Columbia",
        rating: 5,
        text: "Worth every penny. I tried other AI study tools but Lexaro is the only one that felt polished and reliable.",
    },
];

/**
 * Testimonials carousel with auto-scrolling animation.
 */
export default function TestimonialsCarousel() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    // Auto-scroll effect
    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer) return;

        let animationId: number;
        let scrollPosition = 0;
        const scrollSpeed = 0.5; // pixels per frame

        const animate = () => {
            if (!isHovered && scrollContainer) {
                scrollPosition += scrollSpeed;

                // Reset to start when we've scrolled half (since content is duplicated)
                const halfWidth = scrollContainer.scrollWidth / 2;
                if (scrollPosition >= halfWidth) {
                    scrollPosition = 0;
                }

                scrollContainer.scrollLeft = scrollPosition;
            }
            animationId = requestAnimationFrame(animate);
        };

        animationId = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animationId);
        };
    }, [isHovered]);

    // Duplicate testimonials for seamless loop
    const duplicatedTestimonials = [...TESTIMONIALS, ...TESTIMONIALS];

    return (
        <section className="border-t border-white/10 py-16 overflow-hidden">
            <div className="mx-auto max-w-6xl px-4 md:px-6 mb-10">
                <FadeInSection>
                    <div className="text-center">
                        <p className="text-xs tracking-[0.25em] text-white/60 uppercase">
                            Trusted by Students
                        </p>
                        <h2 className="mt-2 text-2xl md:text-3xl font-semibold">
                            Loved by students everywhere.
                        </h2>
                        <p className="mt-3 text-white/60 max-w-xl mx-auto">
                            Join thousands of students using Lexaro to study smarter.
                        </p>
                    </div>
                </FadeInSection>
            </div>

            {/* Scrolling container */}
            <div
                ref={scrollRef}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="flex gap-4 overflow-x-hidden cursor-grab active:cursor-grabbing"
                style={{ scrollBehavior: "auto" }}
            >
                {duplicatedTestimonials.map((testimonial, index) => (
                    <TestimonialCard
                        key={`${testimonial.id}-${index}`}
                        testimonial={testimonial}
                    />
                ))}
            </div>

            {/* Stats row */}
            <div className="mx-auto max-w-6xl px-4 md:px-6 mt-12">
                <FadeInSection delay={0.1}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <StatItem value="50,000+" label="Study sessions" />
                        <StatItem value="10,000+" label="Documents processed" />
                        <StatItem value="4.9/5" label="Average rating" />
                        <StatItem value="98%" label="Would recommend" />
                    </div>
                </FadeInSection>
            </div>
        </section>
    );
}

/**
 * Individual testimonial card.
 */
function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
    return (
        <div className="flex-shrink-0 w-[340px] md:w-[380px] rounded-2xl bg-white/[0.03] border border-white/10 p-6 transition-all hover:bg-white/[0.05] hover:border-white/15">
            {/* Header */}
            <div className="mb-4">
                <div className="font-medium text-sm text-white">
                    {testimonial.name}
                </div>
                <div className="text-xs text-white/50">
                    {testimonial.role}
                </div>
            </div>

            {/* Stars */}
            <div className="flex items-center gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                        key={i}
                        className={`h-4 w-4 ${
                            i < testimonial.rating
                                ? "text-amber-400 fill-amber-400"
                                : "text-white/20"
                        }`}
                    />
                ))}
            </div>

            {/* Text */}
            <p className="text-sm text-white/70 leading-relaxed">
                "{testimonial.text}"
            </p>
        </div>
    );
}

/**
 * Stat item for the stats row.
 */
function StatItem({ value, label }: { value: string; label: string }) {
    return (
        <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-white">
                {value}
            </div>
            <div className="text-sm text-white/50 mt-1">{label}</div>
        </div>
    );
}
