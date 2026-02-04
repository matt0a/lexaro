"use client";

import React, { useEffect, useState, useRef } from "react";
import { TrendingUp, CheckCircle2, ArrowRight } from "lucide-react";

import StarBorderCard from "@/components/reactbits/StarBorderCard";
import GlareHoverCard from "@/components/reactbits/GlareHoverCard";
import FadeInSection from "@/components/reactbits/FadeInSection";
import ShimmerButton from "@/components/reactbits/ShimmerButton";

// Hook for counting animation
function useCountUp(end: number, duration: number = 2000, startOnView: boolean = true) {
    const [count, setCount] = useState(0);
    const [hasStarted, setHasStarted] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!startOnView) {
            setHasStarted(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasStarted) {
                    setHasStarted(true);
                }
            },
            { threshold: 0.3 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [hasStarted, startOnView]);

    useEffect(() => {
        if (!hasStarted) return;

        let startTime: number;
        let animationFrame: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);

            // Easing function for smooth deceleration
            const easeOut = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(easeOut * end));

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                setCount(end);
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [hasStarted, end, duration]);

    return { count, ref };
}

// Animated trend line component
function AnimatedTrendLine() {
    const [animated, setAnimated] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !animated) {
                    setAnimated(true);
                }
            },
            { threshold: 0.3 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [animated]);

    // Data points for the trend (normalized 0-100) - improving upward
    const points = [12, 18, 15, 25, 22, 30, 28, 38, 42, 48, 52, 55];
    const maxVal = 60;
    const height = 48;
    const width = 200;
    const stepX = width / (points.length - 1);

    // Build path
    const pathPoints = points.map((p, i) => {
        const x = i * stepX;
        const y = height - (p / maxVal) * height;
        return { x, y };
    });

    // Create smooth curve path
    let pathD = `M ${pathPoints[0].x} ${pathPoints[0].y}`;
    for (let i = 1; i < pathPoints.length; i++) {
        const prev = pathPoints[i - 1];
        const curr = pathPoints[i];
        const cpX = (prev.x + curr.x) / 2;
        pathD += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    return (
        <div ref={ref} className="w-full h-12 relative">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
                {/* Gradient definition */}
                <defs>
                    <linearGradient id="trendGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                    <linearGradient id="trendFill" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Fill area under curve */}
                <path
                    d={`${pathD} L ${width} ${height} L 0 ${height} Z`}
                    fill="url(#trendFill)"
                    className={`transition-opacity duration-1000 ${animated ? "opacity-100" : "opacity-0"}`}
                />

                {/* Animated line */}
                <path
                    d={pathD}
                    fill="none"
                    stroke="url(#trendGradient)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={animated ? "animate-draw-line" : ""}
                    style={{
                        strokeDasharray: 400,
                        strokeDashoffset: animated ? 0 : 400,
                        transition: "stroke-dashoffset 2s ease-out",
                    }}
                />

                {/* Animated dot at end */}
                <circle
                    cx={pathPoints[pathPoints.length - 1].x}
                    cy={pathPoints[pathPoints.length - 1].y}
                    r="4"
                    fill="#06b6d4"
                    className={`transition-all duration-500 ${animated ? "opacity-100 scale-100" : "opacity-0 scale-0"}`}
                    style={{ transitionDelay: "1.8s", transformOrigin: "center", transformBox: "fill-box" }}
                />
            </svg>

            {/* Pulsing glow on the end dot */}
            {animated && (
                <div
                    className="absolute w-3 h-3 rounded-full bg-cyan-400/50 animate-ping"
                    style={{
                        right: 0,
                        top: `${(pathPoints[pathPoints.length - 1].y / height) * 100}%`,
                        transform: "translate(50%, -50%)",
                    }}
                />
            )}
        </div>
    );
}

// Stat card with counting animation
function AnimatedStat({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
    const { count, ref } = useCountUp(value, 2000);

    return (
        <div ref={ref} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-[11px] uppercase tracking-wider text-white/55">{label}</div>
            <div className="mt-1 text-lg font-semibold tabular-nums">
                {count}{suffix}
            </div>
        </div>
    );
}

// Time stat with hours and minutes
function AnimatedTimeStat({ label, totalMinutes }: { label: string; totalMinutes: number }) {
    const { count, ref } = useCountUp(totalMinutes, 2000);
    const hours = Math.floor(count / 60);
    const mins = count % 60;

    return (
        <div ref={ref} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-[11px] uppercase tracking-wider text-white/55">{label}</div>
            <div className="mt-1 text-lg font-semibold tabular-nums">
                {hours}h {mins}m
            </div>
        </div>
    );
}

function Header({
                    kicker,
                    title,
                    subtitle,
                }: {
    kicker: string;
    title: string;
    subtitle: string;
}) {
    return (
        <div>
            <p className="text-xs tracking-[0.25em] text-white/60 uppercase">{kicker}</p>
            <h2 className="mt-2 text-3xl md:text-4xl font-semibold">{title}</h2>
            <p className="mt-3 text-white/70 max-w-2xl">{subtitle}</p>
        </div>
    );
}

function VideoDemo({ label, src }: { label: string; src: string }) {
    return (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black shadow-lg">
            {/* Label overlay */}
            <div className="absolute top-3 left-3 z-10 rounded-full bg-black/70 backdrop-blur-sm border border-white/10 px-3 py-1">
                <span className="text-xs font-medium text-white/90">{label}</span>
            </div>

            {/* Video at actual size */}
            <video
                src={src}
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                className="w-full h-auto block"
            />

            {/* subtle sheen */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-30" />
        </div>
    );
}

export default function DemoShowcase() {
    return (
        <section className="relative overflow-hidden">
            {/* background blooms */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/2 top-10 h-[520px] w-[980px] -translate-x-1/2 rounded-full bg-sky-500/10 blur-3xl" />
                <div className="absolute left-1/3 top-44 h-[420px] w-[840px] -translate-x-1/2 rounded-full bg-fuchsia-500/10 blur-3xl" />
            </div>

            <div className="relative z-10 mx-auto max-w-6xl px-4 md:px-6 py-20">
                <FadeInSection>
                    <Header
                        kicker="Preview"
                        title="See the loop: attempt → grade → improve"
                        subtitle="A premium flow that feels like a real exam platform: quick practice, instant feedback, and clear next steps."
                    />
                </FadeInSection>

                <div className="mt-10 flex flex-col gap-6">
                    {/* Row 1: Mock analytics + Official results side by side */}
                    <div className="grid gap-6 md:grid-cols-2">
                        <FadeInSection delay={0.06}>
                            <StarBorderCard>
                                <div className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm font-semibold">Mock analytics</div>
                                        <span className="text-xs text-white/55">last 7 days</span>
                                    </div>

                                    <div className="mt-4 grid grid-cols-3 gap-3">
                                        <AnimatedStat label="Accuracy" value={78} suffix="%" />
                                        <AnimatedStat label="Streak" value={5} suffix=" days" />
                                        <AnimatedTimeStat label="Time" totalMinutes={130} />
                                    </div>

                                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-white/70">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm font-semibold text-white/85">Trend</div>
                                            <div className="text-xs text-white/55">improving</div>
                                        </div>
                                        <div className="mt-2">
                                            <AnimatedTrendLine />
                                        </div>
                                    </div>
                                </div>
                            </StarBorderCard>
                        </FadeInSection>

                        <FadeInSection delay={0.08}>
                            <GlareHoverCard className="bg-gradient-to-b from-violet-500/12 to-white/5 h-full">
                                <div className="p-6 flex flex-col h-full">
                                    <div className="flex items-center gap-2 text-white/85">
                                        <CheckCircle2 className="h-5 w-5" />
                                        <div className="font-semibold">"Official" results format</div>
                                    </div>

                                    <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/75">
                                        <div className="flex items-center justify-between">
                                            <span className="text-white/85 font-semibold">Quiz attempt</span>
                                            <span className="text-white/60">Score: 4/5</span>
                                        </div>
                                        <div className="mt-2 text-white/65">
                                            Next steps: review pages 12–14 → retake (hard) → generate flashcards.
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-4">
                                        <ShimmerButton href="/get-started" variant="primary" className="w-full justify-center">
                                            Try it free <ArrowRight className="h-4 w-4" />
                                        </ShimmerButton>
                                    </div>
                                </div>
                            </GlareHoverCard>
                        </FadeInSection>
                    </div>

                    {/* Row 2: Progress that feels instant */}
                    <FadeInSection delay={0.1}>
                        <GlareHoverCard className="bg-gradient-to-b from-sky-500/12 to-white/5">
                            <div className="p-6">
                                <div className="flex items-center gap-2 text-white/85">
                                    <TrendingUp className="h-5 w-5" />
                                    <div className="font-semibold">Progress that feels instant</div>
                                </div>
                                <p className="mt-2 text-white/70">
                                    Every attempt updates your accuracy and weak topics — so the next study action is obvious.
                                </p>
                            </div>
                        </GlareHoverCard>
                    </FadeInSection>

                    {/* Row 3: Video demos side by side */}
                    <FadeInSection delay={0.12}>
                        <div className="grid gap-6 md:grid-cols-2">
                            <VideoDemo label="Lexaro Voice" src="/videos/lexaro-voice-loop.mp4" />
                            <VideoDemo label="Lexaro Learn" src="/videos/lexaro-learn-loop.mp4" />
                        </div>
                    </FadeInSection>
                </div>
            </div>
        </section>
    );
}
