'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import api from '@/lib/api';
import FloatingLinesBackground from '@/components/reactbits/FloatingLinesBackground';
import StarBorderCard from '@/components/reactbits/StarBorderCard';
import { Check } from 'lucide-react';

type BillingCycle = 'monthly' | 'yearly';

type MeUsage = {
    plan: string;
    monthlyUsed: number;
    dailyUsed: number;
    email?: string;
};

function cn(...classes: Array<string | undefined | false | null>) {
    return classes.filter(Boolean).join(' ');
}

function formatPlan(p?: string) {
    if (!p) return 'Free';
    const up = p.toUpperCase();
    if (up === 'FREE') return 'Free';
    if (up === 'PREMIUM') return 'Premium';
    if (up === 'BUSINESS_PLUS' || up === 'PREMIUM_PLUS') return 'Premium Plus';
    return p;
}

function normalizePlanFamily(planRaw: string) {
    const up = (planRaw || 'FREE').toUpperCase();
    if (up === 'BUSINESS_PLUS') return 'PREMIUM_PLUS';
    if (up === 'PREMIUM_PLUS') return 'PREMIUM_PLUS';
    if (up === 'PREMIUM') return 'PREMIUM';
    return 'FREE';
}

function fmtUSD(n: number) {
    return `$${n.toFixed(2)}`;
}

type Metric = { label: string; value: string; sub?: string };

export default function BillingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [me, setMe] = useState<MeUsage | null>(null);
    const [loading, setLoading] = useState(true);

    const [cycle, setCycle] = useState<BillingCycle>('monthly');
    const [busyPlanKey, setBusyPlanKey] = useState<string | null>(null);

    const [err, setErr] = useState<string>('');
    const [notice, setNotice] = useState<string>('');
    const [syncing, setSyncing] = useState(false);

    const monthly = { premium: 14.99, plus: 29.99 };
    const yearlyTotal = { premium: 119.99, plus: 239.99 };
    const yearlyPerMonth = {
        premium: yearlyTotal.premium / 12,
        plus: yearlyTotal.plus / 12,
    };

    const DISCOUNT_LABEL = 'Save 19%';

    const loadMe = async () => {
        try {
            const res = await api.get<MeUsage>('/me/usage');
            setMe(res.data);
            return res.data;
        } catch {
            router.replace('/login');
            return null;
        }
    };

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) {
            router.replace('/login');
            return;
        }

        (async () => {
            try {
                await loadMe();
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router]);

    // Stripe return handler
    useEffect(() => {
        const checkout = searchParams.get('checkout');
        const sessionId = searchParams.get('session_id');
        if (!checkout) return;

        (async () => {
            if (checkout === 'cancel') {
                setNotice('Checkout cancelled.');
                router.replace('/billing');
                return;
            }

            if (checkout === 'success' && sessionId) {
                setErr('');
                setNotice('');
                setSyncing(true);

                try {
                    await api.post('/billing/sync', { sessionId });
                    window.dispatchEvent(new Event('lexaro:billing-updated'));
                    await loadMe();
                    setNotice('Payment confirmed — your plan is now active.');
                } catch {
                    setErr('Payment confirmed, but plan sync failed. Try refreshing in a moment.');
                } finally {
                    setSyncing(false);
                    router.replace('/billing');
                }
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    const currentPlanRaw = (me?.plan || 'FREE').toUpperCase();
    const currentFamily = useMemo(() => normalizePlanFamily(currentPlanRaw), [currentPlanRaw]);

    const startCheckout = async (planKey: string) => {
        setErr('');
        setNotice('');
        setBusyPlanKey(planKey);

        try {
            const { data } = await api.post<{ url?: string }>('/billing/checkout', { plan: planKey });
            if (data?.url) {
                window.location.href = data.url;
                return;
            }
            setErr('Could not start checkout.');
        } catch (e: any) {
            setErr(e?.response?.data?.message || e?.message || 'Could not start checkout.');
        } finally {
            setBusyPlanKey(null);
        }
    };

    const cards = useMemo(() => {
        const premiumKey = cycle === 'monthly' ? 'PREMIUM' : 'PREMIUM_YEARLY';
        const plusKey = cycle === 'monthly' ? 'PREMIUM_PLUS' : 'PREMIUM_PLUS_YEARLY';

        return [
            {
                key: 'FREE',
                family: 'FREE' as const,
                name: 'Free',
                subtitle: 'Try it out with monthly limits.',
                priceBig: 'Free',
                priceSub: '',
                yearlyBadge: '',
                badgeTop: 'Standard',
                badgeTone: 'gray' as const,
                badgeRight: '',
                featured: false,
                metrics: [
                    { label: 'Study chat', value: '40', sub: '/mo' },
                    { label: 'Generate', value: '10', sub: '/mo' },
                    { label: 'Docs processed', value: '300', sub: 'pages/mo' },
                    { label: 'Text-to-speech', value: '10,000', sub: 'chars/mo' },
                ] as Metric[],
                bullets: [
                    'Study Copilot with citations (limited)',
                    'OCR + PDF extraction included',
                    'Notes + quizzes (limited)',
                    'Voice included (monthly cap)',
                ],
                footnote:
                    'Free includes monthly caps for normal use — protective rate & concurrency limits still apply to prevent abuse.',
                note: 'No credit card required',
                canSwitch: false,
                isCurrent: currentFamily === 'FREE',
                ctaVariant: 'ghost' as const,
            },
            {
                key: premiumKey,
                family: 'PREMIUM' as const,
                name: 'Premium',
                subtitle: 'Daily studying with higher limits and speed.',
                priceBig: cycle === 'monthly' ? fmtUSD(monthly.premium) : fmtUSD(yearlyPerMonth.premium),
                priceSub: cycle === 'monthly' ? '/month' : '/mo',
                subLine: cycle === 'monthly' ? '' : `Billed annually: ${fmtUSD(yearlyTotal.premium)}/yr`,
                yearlyBadge: cycle === 'yearly' ? DISCOUNT_LABEL : '',
                badgeTop: 'Most popular',
                badgeTone: 'blue' as const,
                badgeRight: 'Priority',
                featured: true,
                metrics: [
                    { label: 'Study chat', value: 'Unlimited' },
                    { label: 'Generate', value: 'Unlimited' },
                    { label: 'Docs processed', value: 'Unlimited' },
                    { label: 'Text-to-speech', value: '900,000', sub: 'chars/mo' },
                ] as Metric[],
                bullets: [
                    'Unlimited Study chat + generators',
                    'Generate notes, flashcards, quizzes',
                    'Faster streaming + higher concurrency',
                    'Stronger reliability safeguards',
                ],
                footnote:
                    'Paid plans remove monthly caps for normal use — protective rate & concurrency limits still apply to prevent abuse.',
                note: 'Cancel anytime',
                canSwitch: true,
                isCurrent: currentFamily === 'PREMIUM',
                ctaVariant: 'primary' as const,
            },
            {
                key: plusKey,
                family: 'PREMIUM_PLUS' as const,
                name: 'Premium+',
                subtitle: 'Fastest experience + higher voice limits.',
                priceBig: cycle === 'monthly' ? fmtUSD(monthly.plus) : fmtUSD(yearlyPerMonth.plus),
                priceSub: cycle === 'monthly' ? '/month' : '/mo',
                subLine: cycle === 'monthly' ? '' : `Billed annually: ${fmtUSD(yearlyTotal.plus)}/yr`,
                yearlyBadge: cycle === 'yearly' ? DISCOUNT_LABEL : '',
                badgeTop: 'Best value',
                badgeTone: 'pink' as const,
                badgeRight: 'Priority',
                featured: false,
                metrics: [
                    { label: 'Study chat', value: 'Unlimited' },
                    { label: 'Generate', value: 'Unlimited' },
                    { label: 'Docs processed', value: 'Unlimited' },
                    { label: 'Text-to-speech', value: '2,000,000', sub: 'chars/mo' },
                ] as Metric[],
                bullets: [
                    'Everything in Premium',
                    'Bigger context + more speed',
                    'Best for long projects + large materials',
                    'Highest priority safeguards',
                ],
                footnote:
                    'Paid plans remove monthly caps for normal use — protective rate & concurrency limits still apply to prevent abuse.',
                note: 'Cancel anytime',
                canSwitch: true,
                isCurrent: currentFamily === 'PREMIUM_PLUS',
                ctaVariant: 'ghost' as const,
            },
        ];
    }, [cycle, currentFamily]);

    if (loading) {
        return <div className="min-h-screen grid place-items-center text-white bg-black">Loading…</div>;
    }
    if (!me) return null;

    return (
        <div className="min-h-screen bg-black text-white">
            <Sidebar />

            <main className="md:ml-56">
                <div className="relative overflow-hidden min-h-screen">
                    {/* ✅ Match Plans/Landing vibe */}
                    <div className="pointer-events-none absolute inset-0 -z-10">
                        <FloatingLinesBackground />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-sky-900/10 to-black/35" />
                        <div className="absolute left-1/2 top-10 h-[540px] w-[980px] -translate-x-1/2 rounded-full bg-sky-500/10 blur-3xl" />
                        <div className="absolute left-1/3 top-52 h-[420px] w-[840px] -translate-x-1/2 rounded-full bg-fuchsia-500/10 blur-3xl" />
                        <div className="absolute inset-0 bg-vignette-strong opacity-100" />
                    </div>

                    <div className="px-4 md:px-6 py-10 max-w-6xl mx-auto relative">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-semibold">Plan & Billing</h1>
                                <p className="mt-2 text-sm text-white/65">
                                    Current plan: <span className="text-white/85 font-medium">{formatPlan(currentPlanRaw)}</span>
                                </p>
                            </div>

                            <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/55 backdrop-blur-md p-1">
                                <button
                                    onClick={() => setCycle('monthly')}
                                    className={cn(
                                        'rounded-full px-4 py-2 text-sm font-semibold transition',
                                        cycle === 'monthly' ? 'bg-white text-black' : 'text-white/70 hover:text-white'
                                    )}
                                >
                                    Monthly
                                </button>

                                <button
                                    onClick={() => setCycle('yearly')}
                                    className={cn(
                                        'rounded-full px-4 py-2 text-sm font-semibold transition',
                                        cycle === 'yearly' ? 'bg-white text-black' : 'text-white/70 hover:text-white'
                                    )}
                                >
                                    Yearly
                                </button>
                            </div>
                        </div>

                        {syncing ? (
                            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white/80">
                                Syncing your subscription…
                            </div>
                        ) : null}

                        {!!notice && !syncing ? (
                            <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                                {notice}
                            </div>
                        ) : null}

                        {!!err ? (
                            <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                {err}
                            </div>
                        ) : null}

                        {/* ✅ Detailed cards kept + StarBorder + proper pills */}
                        <div className="mt-8 grid gap-6 md:grid-cols-3">
                            {cards.map((c) => {
                                const isBusy = busyPlanKey === c.key;

                                const cta =
                                    c.isCurrent ? (
                                        <button
                                            disabled
                                            className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white/70"
                                        >
                                            Current plan
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => (c.canSwitch ? startCheckout(c.key) : null)}
                                            disabled={!c.canSwitch || isBusy || syncing}
                                            className={cn(
                                                'w-full rounded-2xl px-4 py-3 text-sm font-semibold transition border',
                                                !c.canSwitch
                                                    ? 'border-white/10 bg-white/[0.03] text-white/60 cursor-not-allowed'
                                                    : c.ctaVariant === 'primary'
                                                        ? 'border-transparent bg-[var(--accent)] text-white hover:opacity-95 shadow-[0_16px_60px_rgba(14,165,233,.25)]'
                                                        : 'border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]',
                                                isBusy || syncing ? 'opacity-70 cursor-wait' : ''
                                            )}
                                        >
                                            {isBusy ? 'Redirecting…' : 'Upgrade'}
                                        </button>
                                    );

                                const cardShell = (
                                    <div
                                        className={cn(
                                            'rounded-3xl bg-black/55 backdrop-blur-md shadow-[0_26px_90px_rgba(0,0,0,.7)] h-full relative overflow-hidden',
                                            c.featured ? '' : 'border border-white/10',
                                            c.isCurrent ? 'border-white/20' : ''
                                        )}
                                    >
                                        {/* subtle tier tint like marketing cards */}
                                        {c.family !== 'FREE' ? (
                                            <div
                                                className={cn(
                                                    'pointer-events-none absolute inset-0 opacity-90',
                                                    c.family === 'PREMIUM' &&
                                                    'bg-[radial-gradient(circle_at_25%_20%,rgba(14,165,233,0.22),transparent_55%),radial-gradient(circle_at_75%_70%,rgba(34,211,238,0.12),transparent_55%)]',
                                                    c.family === 'PREMIUM_PLUS' &&
                                                    'bg-[radial-gradient(circle_at_25%_20%,rgba(217,70,239,0.22),transparent_55%),radial-gradient(circle_at_75%_70%,rgba(99,102,241,0.14),transparent_55%)]'
                                                )}
                                            />
                                        ) : null}

                                        <div className="relative z-10 p-7 h-full flex flex-col">
                                            {/* top row */}
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="text-xl font-semibold">{c.name}</div>
                                                    <p className="mt-2 text-sm text-white/70">{c.subtitle}</p>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {c.badgeTop ? (
                                                        <span
                                                            className={cn(
                                                                'inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold leading-none border',
                                                                c.badgeTone === 'blue'
                                                                    ? 'bg-sky-500/15 border-sky-400/25 text-sky-200'
                                                                    : c.badgeTone === 'pink'
                                                                        ? 'bg-fuchsia-500/15 border-fuchsia-400/25 text-fuchsia-200'
                                                                        : 'bg-white/5 border-white/10 text-white/70'
                                                            )}
                                                        >
                              {c.badgeTop}
                            </span>
                                                    ) : null}

                                                    {c.badgeRight ? (
                                                        <span className="inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold leading-none border bg-white/5 border-white/10 text-white/70">
                              {c.badgeRight}
                            </span>
                                                    ) : null}
                                                </div>
                                            </div>

                                            {/* price */}
                                            <div className="mt-5">
                                                <div className="flex items-end gap-2">
                                                    <div className="text-3xl font-semibold">{c.priceBig}</div>
                                                    {c.priceSub ? <div className="pb-1 text-sm text-white/60">{c.priceSub}</div> : null}
                                                </div>

                                                {'yearlyBadge' in c && c.yearlyBadge ? (
                                                    <div className="mt-2">
                            <span className="inline-flex whitespace-nowrap rounded-full bg-emerald-500/15 border border-emerald-400/25 px-3 py-1 text-[10px] font-semibold text-emerald-200 shadow-[0_10px_30px_rgba(16,185,129,.18)]">
                              {c.yearlyBadge}
                            </span>
                                                    </div>
                                                ) : null}

                                                {'subLine' in c && (c as any).subLine ? (
                                                    <div className="mt-2 text-sm text-white/60">{(c as any).subLine}</div>
                                                ) : null}
                                            </div>

                                            {/* metrics */}
                                            <div className="mt-6 grid grid-cols-2 gap-3">
                                                {c.metrics.map((m) => (
                                                    <div key={m.label} className="rounded-2xl border border-white/10 bg-black/45 p-4">
                                                        <div className="text-[11px] uppercase tracking-wide text-white/55">{m.label}</div>
                                                        <div className="mt-2 text-lg font-semibold leading-none">
                                                            {m.value}{' '}
                                                            {m.sub ? <span className="text-sm font-medium text-white/55">{m.sub}</span> : null}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* bullets */}
                                            <ul className="mt-6 space-y-2 text-sm text-white/75">
                                                {c.bullets.map((b) => (
                                                    <li key={b} className="flex gap-2">
                                                        <Check className="h-4 w-4 mt-0.5 text-white/55" />
                                                        <span>{b}</span>
                                                    </li>
                                                ))}
                                            </ul>

                                            {/* footnote */}
                                            <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-white/55">
                                                {c.footnote}
                                            </div>

                                            {/* CTA */}
                                            <div className="mt-6">{cta}</div>

                                            {c.note ? <div className="mt-3 text-center text-xs text-white/45">{c.note}</div> : null}
                                        </div>
                                    </div>
                                );

                                // ✅ StarBorder only like pricing page (featured plan)
                                if (c.featured) {
                                    return (
                                        <StarBorderCard key={c.key} alwaysAnimate speed={16}>
                                            {cardShell}
                                        </StarBorderCard>
                                    );
                                }

                                return (
                                    <div key={c.key} className="h-full">
                                        {cardShell}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-8 text-xs text-white/45">Need help with billing? Contact support.</div>
                    </div>
                </div>
            </main>
        </div>
    );
}
