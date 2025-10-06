// app/trial-offer/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Lock, Bell, Calendar, Sparkles } from 'lucide-react';

const YEARLY_TOTAL = 145;
const perWeek = (annual: number) => annual / 52;
const fmtMoney = (n: number) => `$${n.toFixed(2)}`;

/** Countdown for the sticky ribbon */
function useCountdown(seconds: number) {
    const [remain, setRemain] = useState(seconds);
    useEffect(() => {
        const t = setInterval(() => setRemain((r) => (r > 0 ? r - 1 : 0)), 1000);
        return () => clearInterval(t);
    }, []);
    const mm = Math.floor(remain / 60).toString().padStart(2, '0');
    const ss = (remain % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
}

/** Stable cross-env date helpers (avoid hydration mismatch) */
function addDays(base: Date, days: number) { const d = new Date(base); d.setDate(d.getDate() + days); return d; }
const US_SHORT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }); // always "Oct 8"
function fmtTimeline(d: Date) { return US_SHORT.format(d); }

function Stars({ n = 5 }: { n?: number }) {
    return (
        <div className="flex items-center gap-1" aria-label={`${n} star rating`}>
            {Array.from({ length: n }).map((_, i) => (
                <svg key={i} viewBox="0 0 24 24" className="h-4 w-4 text-yellow-400" fill="currentColor">
                    <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
            ))}
        </div>
    );
}

const REVIEWS = [
    { name: 'Jade',   text: 'Turned my PDFs and stories into audio so I can finish faster. Totally worth it.' },
    { name: 'Marcus', text: 'Listening made long readings so much easier. I’m actually ahead in classes now.' },
    { name: 'Elena',  text: 'Natural voices, easy controls, keeps me focused. Exactly what I needed.' },
    { name: 'Tariq',  text: 'I use it during commutes—the voices sound great and the flow is smooth.' },
    { name: 'Priya',  text: 'The language options are a lifesaver for my research. Highly recommend.' },
    { name: 'Hannah', text: 'Super simple to use. Upload, listen, done. It fits right into my routine.' },
];

function TimelineIcon({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative flex h-10 items-center justify-center">
            {/* halo */}
            <span className="absolute z-10 h-11 w-11 rounded-full bg-black/60" />
            {/* icon badge */}
            <span className="relative z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/60 shadow-inner ring-1 ring-white/10">
        {children}
      </span>
        </div>
    );
}

export default function TrialOfferPage() {
    const router = useRouter();
    const reserved = useCountdown(15 * 60);
    const weeklyCopy = `${fmtMoney(perWeek(YEARLY_TOTAL))} / week`;

    const onStartTrial = () => router.push('/signup?plan=PREMIUM&cycle=yearly&trial=3d');

    /** GSAP: restore scroll-trigger reveal (cards start hidden) */
    useEffect(() => {
        let ctx: any;
        (async () => {
            try {
                const gsap = (await import('gsap')).default;
                const { ScrollTrigger } = await import('gsap/ScrollTrigger');
                gsap.registerPlugin(ScrollTrigger);
                ctx = gsap.context(() => {
                    gsap.utils.toArray<HTMLElement>('.review-card').forEach((card, i) => {
                        gsap.fromTo(
                            card,
                            { opacity: 0, y: 28 },
                            {
                                opacity: 1,
                                y: 0,
                                duration: 0.6,
                                ease: 'power2.out',
                                delay: i * 0.06,
                                scrollTrigger: {
                                    trigger: card,
                                    start: 'top 85%',
                                    toggleActions: 'play none none reverse',
                                },
                            }
                        );
                    });
                });
            } catch {
                // If GSAP fails to load, the cards will remain hidden.
                // If you want a fallback, remove the "opacity-0" class on the cards below.
            }
        })();
        return () => ctx && ctx.revert();
    }, []);

    return (
        <main className="min-h-screen bg-black text-white">
            {/* Sticky ribbon at very top (no gap) */}
            <div className="sticky top-0 z-50 border-b border-white/10 bg-white/[0.02] backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 text-sm">
                    <div className="text-white/80">
                        Your free trial is reserved for:&nbsp;
                        <span className="font-semibold text-white">{reserved}</span>
                    </div>
                    <button onClick={onStartTrial} className="rounded-full bg-blue-600 px-4 py-2 font-semibold hover:bg-blue-700">
                        Start for Free
                    </button>
                </div>
            </div>

            {/* Hero + Timeline */}
            <section className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 pt-6 pb-10 md:grid-cols-2 md:pt-8 md:pb-14">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
                        <Sparkles className="h-3.5 w-3.5" />
                        Premium trial
                    </div>

                    <h1 className="mt-3 text-[34px] font-bold leading-tight sm:text-5xl">
                        Unlock Premium
                        <br />
                        <span className="text-green-400">3-day free trial</span>
                    </h1>

                    <p className="mt-3 text-white/70">
                        $0 today. After your trial, continue at <span className="font-semibold text-white">$145.00/year</span>, only{' '}
                        <span className="font-semibold text-white">{weeklyCopy}</span>.
                    </p>

                    <ul className="mt-6 space-y-4 text-white/90">
                        {[
                            'Natural, higher-quality voices',
                            '200+ voices and 60+ languages',
                            'Faster, smoother rendering while you work',
                            'Priority support and long-project optimization',
                            'Seamless syncing across devices',
                        ].map((t) => (
                            <li key={t} className="flex items-start gap-3">
                                <Check className="mt-0.5 h-5 w-5 text-emerald-400" />
                                <span>{t}</span>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-8">
                        <button
                            onClick={onStartTrial}
                            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-base font-semibold hover:bg-blue-700 sm:w-auto"
                        >
                            Start 3-day Premium trial
                        </button>
                        <div className="mt-2 text-xs text-white/60">No charge today • Cancel anytime</div>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                    <div className="pointer-events-none absolute -top-20 right-0 h-56 w-56 rounded-full bg-gradient-to-br from-blue-500/20 via-fuchsia-500/20 to-cyan-400/20 blur-2xl" />
                    <div className="mb-5 text-center text-sm text-white/70">How free trial works</div>

                    <div className="relative h-[320px] md:h-[360px]">
                        <div className="grid h-full grid-cols-[56px_1fr]">
                            {/* spine & icons */}
                            <div className="relative">
                                {/* spine centered and NOT overlapping icon stroke */}
                                <div className="absolute left-1/2 top-0 bottom-0 z-0 w-[2px] -translate-x-1/2 bg-gradient-to-b from-blue-400/60 via-white/15 to-emerald-400/60" />
                                <div className="flex h-full flex-col justify-between">
                                    <TimelineIcon><Lock className="h-5 w-5 text-white/85" /></TimelineIcon>
                                    <TimelineIcon><Bell className="h-5 w-5 text-white/85" /></TimelineIcon>
                                    <TimelineIcon><Calendar className="h-5 w-5 text-white/85" /></TimelineIcon>
                                </div>
                            </div>

                            {/* text */}
                            <div className="flex flex-col justify-between pl-3">
                                <div>
                                    <div className="text-sm font-semibold tracking-wide">TODAY</div>
                                    <div className="text-sm text-white/80">All Premium features instantly unlocked.</div>
                                </div>
                                <div>
                                    <div className="text-sm font-semibold">{fmtTimeline(addDays(new Date(), 2))}</div>
                                    <div className="text-sm text-white/80">We’ll email you a reminder before your trial ends.</div>
                                </div>
                                <div>
                                    <div className="text-sm font-semibold">{fmtTimeline(addDays(new Date(), 3))}</div>
                                    <div className="text-sm text-white/80">Your trial ends unless canceled. Enjoy!</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* spacer so users MUST scroll to reach reviews */}
            <div className="h-32 md:h-40" />

            {/* Reviews (scroll reveal; start hidden) */}
            <section className="mx-auto max-w-6xl px-4 pt-6 pb-16">
                <h2 className="mb-10 text-center text-2xl font-bold sm:text-3xl">People love Lexaro</h2>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    {REVIEWS.slice(0, 3).map((r, idx) => (
                        <article
                            key={`row1-${idx}`}
                            className="review-card opacity-0 will-change-transform rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                        >
                            <Stars />
                            <p className="mt-3 text-sm text-white/85">{r.text}</p>
                            <div className="mt-5 flex items-center gap-3">
                                <span className="inline-block h-8 w-8 rounded-full bg-white/15" />
                                <div className="text-sm font-medium">{r.name}</div>
                            </div>
                        </article>
                    ))}
                </div>

                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
                    {REVIEWS.slice(3).map((r, idx) => (
                        <article
                            key={`row2-${idx}`}
                            className="review-card opacity-0 will-change-transform rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                        >
                            <Stars />
                            <p className="mt-3 text-sm text-white/85">{r.text}</p>
                            <div className="mt-5 flex items-center gap-3">
                                <span className="inline-block h-8 w-8 rounded-full bg-white/15" />
                                <div className="text-sm font-medium">{r.name}</div>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </main>
    );
}
