'use client';

import { useMemo, useState } from 'react';
import api from '@/lib/api';

type PlanKey = 'PREMIUM' | 'PREMIUM_PLUS' | 'PREMIUM_YEARLY' | 'PREMIUM_PLUS_YEARLY';

type CheckoutResponse =
    | { url: string; sessionId?: never }
    | { sessionId: string; url?: never };

export default function TrialOfferPage() {
    const [plan, setPlan] = useState<PlanKey>('PREMIUM');
    const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);
    const [error, setError] = useState<string | null>(null);

    const canStart = useMemo(() => true, []);

    const startCheckout = async (planKey: PlanKey) => {
        setError(null);
        setLoadingPlan(planKey);

        try {
            const res = await api.post<CheckoutResponse>('/billing/checkout', { plan: planKey });

            // ✅ Stripe-hosted Checkout: redirect to the session URL returned by the backend
            if ('url' in res.data && res.data.url) {
                window.location.assign(res.data.url);
                return;
            }

            // ❗ If your backend only returns sessionId, update it to return `url`.
            // Stripe’s docs recommend redirecting to the URL returned when creating the Checkout Session. :contentReference[oaicite:1]{index=1}
            if ('sessionId' in res.data && res.data.sessionId) {
                throw new Error(
                    'Backend returned sessionId only. Please return Checkout Session `url` instead (Stripe.js v8 no longer supports redirectToCheckout).'
                );
            }

            throw new Error('Backend did not return url or sessionId');
        } catch (e: any) {
            setError(e?.response?.data?.message ?? e?.message ?? 'Checkout failed');
        } finally {
            setLoadingPlan(null);
        }
    };

    return (
        <main className="min-h-screen bg-black text-white grid place-items-center px-6">
            <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <h1 className="text-2xl font-semibold">Start your free trial</h1>
                <p className="text-white/70 mt-2">Choose a plan to begin your 3-day trial. Cancel anytime.</p>

                <div className="mt-6 grid gap-3">
                    <PlanRow
                        active={plan === 'PREMIUM'}
                        title="Premium (Monthly)"
                        subtitle="Best for personal use"
                        onClick={() => setPlan('PREMIUM')}
                    />
                    <PlanRow
                        active={plan === 'PREMIUM_PLUS'}
                        title="Premium Plus (Monthly)"
                        subtitle="More limits + faster workflow"
                        onClick={() => setPlan('PREMIUM_PLUS')}
                    />
                    <PlanRow
                        active={plan === 'PREMIUM_YEARLY'}
                        title="Premium (Yearly)"
                        subtitle="Save with annual billing"
                        onClick={() => setPlan('PREMIUM_YEARLY')}
                    />
                    <PlanRow
                        active={plan === 'PREMIUM_PLUS_YEARLY'}
                        title="Premium Plus (Yearly)"
                        subtitle="Max value annual option"
                        onClick={() => setPlan('PREMIUM_PLUS_YEARLY')}
                    />
                </div>

                {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

                <button
                    disabled={!canStart || loadingPlan !== null}
                    onClick={() => startCheckout(plan)}
                    className="mt-6 w-full rounded-xl bg-white text-black font-semibold py-3 disabled:opacity-50"
                >
                    {loadingPlan ? 'Redirecting…' : 'Continue to checkout'}
                </button>
            </div>
        </main>
    );
}

function PlanRow({
                     active,
                     title,
                     subtitle,
                     onClick,
                 }: {
    active: boolean;
    title: string;
    subtitle: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                'text-left rounded-2xl border p-4 transition-colors',
                active ? 'border-white/30 bg-white/10' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.06]',
            ].join(' ')}
        >
            <div className="font-semibold text-white/90">{title}</div>
            <div className="text-sm text-white/60 mt-1">{subtitle}</div>
        </button>
    );
}
