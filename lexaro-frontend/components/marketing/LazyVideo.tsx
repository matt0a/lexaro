"use client";

import React, { useRef, useEffect, useState } from "react";

/**
 * LazyVideo — IntersectionObserver-based lazy-loading ambient video.
 *
 * Defers loading the video src until the element scrolls into view.
 * Uses `preload="none"` and a poster fallback while off-screen.
 * Adds `data-ambient="true"` so reduced-motion CSS can hide it.
 */
type LazyVideoProps = {
    src: string;
    poster?: string;
    className?: string;
};

export default function LazyVideo({ src, poster, className = "" }: LazyVideoProps) {
    const ref = useRef<HTMLVideoElement>(null);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    observer.disconnect();
                }
            },
            { rootMargin: "200px" } // start loading 200px before visible
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <video
            ref={ref}
            src={inView ? src : undefined}
            poster={poster}
            autoPlay={inView}
            loop
            muted
            playsInline
            preload="none"
            data-ambient="true"
            className={className}
        />
    );
}
