'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, ChevronLeft } from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import api from '@/lib/api';
import LightPillarsBackground from '@/components/reactbits/LightPillarsBackground';

type BillingCycle = 'monthly' | 'yearly';

type MeUsage = {
    plan: string; // FREE | PREMIUM | BUSINESS_PLUS etc
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
    if (up === 'BUSINESS_PLUS' || up === 'PREMIUM_PLUS' || up === 'BUSINESS') return 'Premium Plus';
    return p;
}

function planKeyForCheckout(plan: 'PREMIUM' | 'PREMIUM_PLUS', cycle: BillingCycle) {
    if (plan === 'PREMIUM' && cycle === 'monthly') return 'PREMIUM';
    if (plan === 'PREMIUM' && cycle === 'yearly') return 'PREMIUM_YEARLY';
    if (plan === 'PREMIUM_PLUS' && cycle === 'monthly') return 'PREMIUM_PLUS';
    if (plan === 'PREMIUM_PLUS' && cycle === 'yearly') return 'PREMIUM_PLUS_YEARLY';
    return null;
}

export default function UpgradePage() {
    const router = useRouter();
    const params = useSearchParams();

    const [cycle, setCycle] = useState<BillingCycle>('monthly');
    const [usage, setUsage] = useState<MeUsage | null>(null);
    const [loadingUsage, setLoadingUsage] = useState(true);

    const [busyPlan, setBusyPlan] = useState<string | null>(null);
    const [syncing, setSyncing] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    const checkout = params.get('checkout');
    const sessionId = params.get('session_id');

    const currentPlanLabel = useMemo(() => formatPlan(usage?.plan), [usage?.plan]);

    const loadUsage = async () => {
        try {
            const { data } = await api.get<MeUsage>('/me/usage');
            setUsage(data);
        } catch {
            router.push('/login');
        } finally {
            setLoadingUsage(false);
        }
    };

    // Preselect cycle if signup saved it
    useEffect(() => {
        try {
            const raw = localStorage.getItem('lexaro:preferred-plan');
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (parsed?.cycle === 'yearly' || parsed?.cycle === 'monthly') setCycle(parsed.cycle);
        } catch {}
    }, []);

    useEffect(() => {
        loadUsage();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Stripe return handler
    useEffect(() => {
        const run = async () => {
            if (checkout === 'success' && sessionId) {
                setSyncing(true);
                try {
                    await api.post('/billing/sync', { sessionId });
                    window.dispatchEvent(new Event('lexaro:billing-updated'));
                    await loadUsage();
                    setToast('Payment confirmed — your plan is now active.');
                } catch {
                    setToast('Payment confirmed, but plan sync failed. Refresh in a moment.');
                } finally {
                    setSyncing(false);
                    router.replace('/upgrade');
                }
            } else if (checkout === 'cancel') {
                setToast('Checkout cancelled.');
                router.replace('/upgrade');
            }
        };
        run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [checkout, sessionId]);

    const checkoutPlan = async (plan: 'PREMIUM' | 'PREMIUM_PLUS') => {
        const planKey = planKeyForCheckout(plan, cycle);
        if (!planKey) return;

        setBusyPlan(planKey);
        try {
            const { data } = await api.post<{ url?: string }>('/billing/checkout', { plan: planKey });
            if (data?.url) {
                window.location.href = data.url;
                return;
            }
            setToast('Could not start checkout. Please try again.');
        } catch (err: any) {
            setToast(err?.response?.data?.message ?? 'Could not start checkout.');
        } finally {
            setBusyPlan(null);
        }
    };

    const plans = useMemo(
        () => [
            {
                key: 'PREMIUM' as const,
                title: 'Scholar',
                priceMonthly: 15,
                priceYearly: 120,
                features: [
                    'Unlimited access to revision questions, MCQs, flashcards & notes',
                    'Unlimited access to exam-style questions',
                    '200 Lexaro credits per month',
                ],
            },
            {
                key: 'PREMIUM_PLUS' as const,
                title: 'Mastermind',
                priceMonthly: 45,
                priceYearly: 360,
                features: [
                    'Everything in Scholar',
                    'Highest quality voices & fastest generation',
                    '1000 Lexaro credits per month',
                    'Priority support',
                ],
            },
        ],
        []
    );

    return (
        <div className="min-h-screen bg-[#07140F] text-white">
            <LightPillarsBackground />

            <div className="mx-auto flex min-h-screen max-w-7xl">
                <Sidebar />

                <main className="flex-1 px-6 py-8 md:px-10">
                    <div className="mb-8 flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => router.push('/dashboard')}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 hover:bg-white/10"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Back
                        </button>

                        <div className="ml-auto text-sm text-white/70">
                            {loadingUsage ? (
                                <span>Loading…</span>
                            ) : (
                                <span>
                                    Current plan: <span className="text-white/90 font-semibold">{currentPlanLabel}</span>
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-4xl font-semibold tracking-tight">All Plans</h1>
                        <p className="mt-2 text-white/70">Every plan includes access to all features.</p>

                        <div className="mt-6 inline-flex rounded-xl border border-white/10 bg-white/5 p-1">
                            <button
                                type="button"
                                onClick={() => setCycle('monthly')}
                                className={cn(
                                    'rounded-lg px-4 py-2 text-sm',
                                    cycle === 'monthly' ? 'bg-white/15 text-white' : 'text-white/70 hover:text-white'
                                )}
                            >
                                Monthly
                            </button>
                            <button
                                type="button"
                                onClick={() => setCycle('yearly')}
                                className={cn(
                                    'rounded-lg px-4 py-2 text-sm',
                                    cycle === 'yearly' ? 'bg-white/15 text-white' : 'text-white/70 hover:text-white'
                                )}
                            >
                                Yearly
                            </button>
                        </div>

                        <p className="mt-3 text-xs text-white/60">Prices shown in USD. Pay with any currency at checkout.</p>
                    </div>

                    {toast ? (
                        <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                            {toast}
                        </div>
                    ) : null}

                    {syncing ? (
                        <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                            Syncing your subscription…
                        </div>
                    ) : null}

                    <div className="grid gap-6 md:grid-cols-2">
                        {plans.map((p) => {
                            const isCurrent =
                                usage?.plan?.toUpperCase() === (p.key === 'PREMIUM' ? 'PREMIUM' : 'BUSINESS_PLUS');

                            const price = cycle === 'monthly' ? p.priceMonthly : p.priceYearly;
                            const per = cycle === 'monthly' ? 'month' : 'year';

                            const planKey = planKeyForCheckout(p.key, cycle) ?? p.key;

                            return (
                                <div
                                    key={p.key}
                                    className={cn(
                                        'rounded-3xl border bg-white/5 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]',
                                        isCurrent ? 'border-white/25' : 'border-white/10'
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="text-lg font-semibold">{p.title}</div>
                                            {isCurrent ? (
                                                <div className="mt-1 inline-flex rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/85">
                                                    Current
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className="mt-6 flex items-baseline gap-2">
                                        <div className="text-4xl font-semibold">${price}</div>
                                        <div className="text-sm text-white/60">per {per}</div>
                                    </div>

                                    <button
                                        type="button"
                                        disabled={busyPlan === planKey || syncing}
                                        onClick={() => checkoutPlan(p.key)}
                                        className={cn(
                                            'mt-6 w-full rounded-2xl px-4 py-3 text-sm font-semibold',
                                            isCurrent
                                                ? 'bg-white/10 text-white/70 cursor-not-allowed'
                                                : 'bg-emerald-700/60 hover:bg-emerald-700/75 text-white'
                                        )}
                                    >
                                        {isCurrent ? 'Active' : busyPlan === planKey ? 'Redirecting…' : 'Subscribe'}
                                    </button>

                                    <div className="mt-6 text-sm text-white/75">This includes:</div>
                                    <ul className="mt-3 space-y-2 text-sm text-white/75">
                                        {p.features.map((f) => (
                                            <li key={f} className="flex gap-2">
                                                <Check className="mt-0.5 h-4 w-4 text-white/70" />
                                                <span>{f}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="mt-6 text-xs text-white/55">
                                        Plan key: <span className="font-mono">{planKey}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-6">
                        <div className="text-2xl font-semibold">Need more credits?</div>
                        <p className="mt-2 text-white/70">
                            If you have a custom use-case (schools, teams, large volumes), message us and we’ll set up a tailored plan.
                        </p>
                    </div>
                </main>
            </div>
        </div>
    );
}
