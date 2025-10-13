"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Voice = {
    id: string;
    label: string;
    role: string;
    audio: string;   // public URL to your MP3 (e.g. /audio/homepage_kristy.mp3)
    avatar?: string; // optional image
};

// Inline SVG fallback avatar (data URI) so missing files won't break startup
const FALLBACK_AVATAR =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(`
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
  <defs>
    <linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
      <stop offset='0%' stop-color='#222'/>
      <stop offset='100%' stop-color='#444'/>
    </linearGradient>
  </defs>
  <rect width='100' height='100' fill='url(#g)'/>
  <circle cx='50' cy='38' r='18' fill='#666'/>
  <rect x='22' y='60' width='56' height='26' rx='13' fill='#666'/>
</svg>`);

const VOICES: Voice[] = [
    {
        id: "kristy",
        label: "Kristy",
        role: "Friendly Narrator",
        audio: "/audio/homepage_kristy.mp3",
        avatar: "/images/avatars/female-1.png",
    },
    {
        id: "june",
        label: "June",
        role: "Warm & Clear",
        audio: "/audio/homepage_june.mp3",
        avatar: "/images/avatars/female-2.png",
    },
    {
        id: "mason",
        label: "Mason",
        role: "Calm & Confident",
        audio: "/audio/homepage_mason.mp3",
        avatar: "/images/avatars/male-1.png",
    },
];

export default function VoicesShowcase() {
    const [activeId, setActiveId] = useState<string | null>(null);
    const audioMapRef = useRef<Record<string, HTMLAudioElement>>({});
    const [isClient, setIsClient] = useState(false);

    // mark client; we won’t touch Audio until this is true
    useEffect(() => {
        setIsClient(true);
    }, []);

    // lazy ensure an Audio element exists for an id
    const ensureAudio = (id: string, src: string) => {
        if (!isClient) return undefined;
        const existing = audioMapRef.current[id];
        if (existing) return existing;
        const a = new Audio(src);
        a.preload = "none";
        a.addEventListener("ended", () => {
            setActiveId((cur) => (cur === id ? null : cur));
        });
        audioMapRef.current[id] = a;
        return a;
    };

    const stopAllExcept = (keepId?: string) => {
        const map = audioMapRef.current;
        Object.entries(map).forEach(([vid, a]) => {
            if (vid !== keepId) {
                a.pause();
                a.currentTime = 0;
            }
        });
    };

    const toggle = (voice: Voice) => {
        const a = ensureAudio(voice.id, voice.audio);
        if (!a) return; // still SSR or something odd
        // stop others
        stopAllExcept(voice.id);

        if (activeId === voice.id && !a.paused) {
            a.pause();
            setActiveId(null);
        } else {
            try {
                a.currentTime = 0;
                a.play();
                setActiveId(voice.id);
            } catch {
                // ignore play rejections
            }
        }
    };

    return (
        <section className="mx-auto max-w-6xl px-6">
            <h3 className="text-center text-white/80 text-sm tracking-widest uppercase">
                Try some of our most popular voices
            </h3>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-8">
                {VOICES.map((v) => {
                    const isActive = activeId === v.id;
                    return (
                        <div key={v.id} className="flex flex-col items-center text-center select-none">
                            <div className="relative">
                                <div className="h-28 w-28 rounded-full overflow-hidden ring-1 ring-white/10 shadow-lg">
                                    {/* If the avatar path 404s, Next/Image just shows broken image; fallback avoids missing file entirely */}
                                    <Image
                                        src={v.avatar || FALLBACK_AVATAR}
                                        alt={v.label}
                                        width={112}
                                        height={112}
                                        className="h-28 w-28 object-cover"
                                        unoptimized={v.avatar ? false : true}
                                    />
                                </div>

                                <button
                                    onClick={() => toggle(v)}
                                    className={[
                                        "absolute -right-2 -bottom-2 h-11 w-11 rounded-full grid place-items-center",
                                        "bg-white text-black shadow-lg transition-transform hover:scale-105",
                                    ].join(" ")}
                                    aria-label={isActive ? `Pause ${v.label}` : `Play ${v.label}`}
                                >
                                    {isActive ? (
                                        // pause icon
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <rect x="6" y="4" width="4" height="16" />
                                            <rect x="14" y="4" width="4" height="16" />
                                        </svg>
                                    ) : (
                                        // play icon
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>

                            <div className="mt-3">
                                <div className="font-medium">{v.label}</div>
                                <div className="text-sm text-white/60">{v.role}</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
