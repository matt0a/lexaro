'use client';

import { useEffect, useState } from 'react';
import { X, Gauge, ShieldCheck, CreditCard } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';

type Props = {
    open: boolean;
    onClose: () => void;
    me: { email: string; plan: string; planRaw: string } | null;
};

/** Matches /me/usage: caps/usage are in WORDS */
type Usage = {
    plan: string;
    unlimited: boolean;
    verified: boolean;

    monthlyCap: number;       // words (Long.MAX_VALUE if unlimited)
    monthlyUsed: number;      // words
    monthlyRemaining: number; // words

    // daily fields exist but we intentionally ignore/hide them (daily is unlimited)
    dailyCap: number;
    dailyUsed: number;
    dailyRemaining: number;
};

function formatPlan(p?: string) {
    if (!p) return 'Free';
    const up = p.toUpperCase();
    if (up === 'FREE') return 'Free';
    if (up === 'PREMIUM') return 'Premium';
    if (up === 'BUSINESS_PLUS' || up === 'PREMIUM_PLUS') return 'Premium Plus';
    return p;
}

function formatWords(n: number) {
    if (!Number.isFinite(n)) return '∞';
    return n.toLocaleString();
}

/** Tiny count-up for nice UX */
function useCountUp(target: number, durationMs = 600) {
    const [val, setVal] = useState(0);
    useEffect(() => {
        if (!Number.isFinite(target)) { setVal(0); return; }
        let raf: number | null = null;
        let start: number | null = null;
        const from = val;
        const step = (t: number) => {
            if (start == null) start = t;
            const p = Math.min(1, (t - start) / durationMs);
            const eased = 1 - Math.pow(1 - p, 3);
            setVal(Math.round(from + (target - from) * eased));
            if (p < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        return () => { if (raf) cancelAnimationFrame(raf); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [target]);
    return val;
}

/** Static plan catalog for the Plan tab (display-only) */
const PLAN_CATALOG = [
    { key: 'FREE',          name: 'Free',         monthlyCap: 3_000 },
    { key: 'PREMIUM',       name: 'Premium',      monthlyCap: 120_000 },
    { key: 'PREMIUM_PLUS',  name: 'Premium Plus', monthlyCap: 300_000 },
    { key: 'BUSINESS_PLUS', name: 'Premium Plus', monthlyCap: 300_000 }, // alias
];

export default function AccountSheet({ open, onClose, me }: Props) {
    const [tab, setTab] = useState<'usage' | 'plan' | 'security'>('usage');
    const [usage, setUsage] = useState<Usage | null>(null);

    // Security form state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNew, setConfirmNew] = useState('');
    const [secBusy, setSecBusy] = useState(false);
    const [secMsg, setSecMsg] = useState<string>('');
    const [secErr, setSecErr] = useState<string>('');

    useEffect(() => {
        if (!open) return;
        (async () => {
            try {
                const { data } = await api.get<Usage>('/me/usage');
                setUsage(data);
            } catch {
                /* ignore */
            }
        })();
    }, [open]);

    useEffect(() => {
        if (!open) {
            // reset security form when sheet closes
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNew('');
            setSecBusy(false);
            setSecMsg('');
            setSecErr('');
        }
    }, [open]);

    const submitChangePassword = async () => {
        setSecMsg('');
        setSecErr('');

        if (newPassword !== confirmNew) {
            setSecErr('New passwords do not match.');
            return;
        }
        if (newPassword.length < 8) {
            setSecErr('New password must be at least 8 characters.');
            return;
        }

        try {
            setSecBusy(true);
            await api.post('/auth/change-password', {
                currentPassword,
                newPassword,
            });
            setSecMsg('Password changed successfully.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNew('');
        } catch (e: any) {
            setSecErr(e?.response?.data?.message || e?.message || 'Failed to change password.');
        } finally {
            setSecBusy(false);
        }
    };

    const friendlyPlan = formatPlan(me?.planRaw || usage?.plan);

    // Monthly progress only (daily is unlimited and hidden)
    const isUnlimited = !!usage?.unlimited || (usage?.monthlyCap ?? 0) > 1e15;
    const monthlyCap = usage?.monthlyCap ?? Number.POSITIVE_INFINITY;
    const monthlyUsed = usage?.monthlyUsed ?? 0;
    const monthlyPct = !usage || isUnlimited || monthlyCap === 0
        ? 0
        : Math.min(100, Math.round((monthlyUsed / monthlyCap) * 100));
    const animMonthly = useCountUp(monthlyUsed);

    const currentPlanKey = (me?.planRaw || usage?.plan || 'FREE').toUpperCase();

    return (
        <div
            className={[
                'fixed inset-0 z-50 transition',
                open ? 'pointer-events-auto' : 'pointer-events-none',
            ].join(' ')}
            aria-hidden={!open}
        >
            {/* Dim background */}
            <div
                className={[
                    'absolute inset-0 bg-black/50 transition-opacity',
                    open ? 'opacity-100' : 'opacity-0',
                ].join(' ')}
                onClick={onClose}
            />
            {/* Sheet */}
            <div
                className={[
                    'absolute right-0 top-0 h-full w-[480px] max-w-[90vw] transform bg-black text-white shadow-2xl border-l border-white/10',
                    'transition-transform',
                    open ? 'translate-x-0' : 'translate-x-full',
                ].join(' ')}
            >
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                    <div>
                        <div className="text-base font-semibold">Account & Settings</div>
                        <div className="text-xs text-white/60">
                            {me?.email} • {friendlyPlan}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 px-5 pt-4">
                    <TabButton active={tab==='usage'} onClick={() => setTab('usage')} icon={<Gauge className="h-4 w-4" />}>Usage</TabButton>
                    <TabButton active={tab==='plan'} onClick={() => setTab('plan')} icon={<CreditCard className="h-4 w-4" />}>Plan</TabButton>
                    <TabButton active={tab==='security'} onClick={() => setTab('security')} icon={<ShieldCheck className="h-4 w-4" />}>Security</TabButton>
                </div>

                <div className="px-5 py-4 overflow-y-auto h-[calc(100%-96px)]">
                    {tab === 'usage' && (
                        <div className="space-y-5">
                            <h3 className="text-lg font-medium">Your usage</h3>

                            {/* Summary cards (no daily) */}
                            <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                <Card label="Plan" value={friendlyPlan ?? '—'} />
                                <Card
                                    label="Monthly Used"
                                    value={
                                        usage
                                            ? `${animMonthly.toLocaleString()} / ${isUnlimited ? '∞' : formatWords(monthlyCap)}`
                                            : '—'
                                    }
                                />
                            </div>

                            {/* Monthly progress only */}
                            {!isUnlimited && usage && (
                                <div className="space-y-4">
                                    <ProgressRow
                                        label="Monthly"
                                        pct={monthlyPct}
                                        hint={`${formatWords(monthlyUsed)} / ${formatWords(monthlyCap)} words`}
                                    />
                                </div>
                            )}

                            {isUnlimited && (
                                <div className="text-sm text-white/60">
                                    Your plan is unlimited. Usage is tracked for your reference.
                                </div>
                            )}
                        </div>
                    )}

                    {tab === 'plan' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Plan & Billing</h3>
                            <p className="text-white/70 text-sm">
                                You’re currently on <span className="font-medium">{friendlyPlan}</span>.
                            </p>

                            {/* Plan catalog with your new caps */}
                            <div className="grid grid-cols-1 gap-3">
                                {PLAN_CATALOG.map((p) => {
                                    const active = p.key === currentPlanKey || (p.key === 'PREMIUM_PLUS' && currentPlanKey === 'BUSINESS_PLUS');
                                    return (
                                        <div
                                            key={p.key}
                                            className={[
                                                'rounded-2xl border p-4 flex items-center justify-between',
                                                active ? 'border-white/20 bg-white/[0.06]' : 'border-white/10 bg-white/[0.03]',
                                            ].join(' ')}
                                        >
                                            <div>
                                                <div className="text-sm font-medium">{p.name}</div>
                                                <div className="text-xs text-white/60">
                                                    {formatWords(p.monthlyCap)} words / month
                                                </div>
                                            </div>
                                            {active ? (
                                                <span className="text-xs text-white/70">Current</span>
                                            ) : (
                                                <Link
                                                    href="/pricing"
                                                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
                                                >
                                                    View options
                                                </Link>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <Link
                                href="/pricing"
                                className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                            >
                                Manage plan
                            </Link>
                        </div>
                    )}

                    {tab === 'security' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Change password</h3>

                            <div className="space-y-3">
                                <Field
                                    label="Current password"
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    autoComplete="current-password"
                                />
                                <Field
                                    label="New password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    autoComplete="new-password"
                                />
                                <Field
                                    label="Confirm new password"
                                    type="password"
                                    value={confirmNew}
                                    onChange={(e) => setConfirmNew(e.target.value)}
                                    autoComplete="new-password"
                                />
                            </div>

                            {!!secErr && <div className="text-sm text-red-300">{secErr}</div>}
                            {!!secMsg && <div className="text-sm text-green-300">{secMsg}</div>}

                            <button
                                onClick={submitChangePassword}
                                disabled={secBusy}
                                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-50"
                            >
                                {secBusy ? 'Saving…' : 'Update password'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function TabButton({
                       active, onClick, children, icon,
                   }: { active: boolean; onClick: () => void; children: React.ReactNode; icon: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={[
                'inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm border',
                active ? 'bg-white/10 border-white/20' : 'bg-transparent border-white/10 hover:bg-white/5',
            ].join(' ')}
        >
            {icon}{children}
        </button>
    );
}

function Card({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs text-white/60">{label}</div>
            <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
        </div>
    );
}

function Field({
                   label, type, value, onChange, autoComplete,
               }: {
    label: string;
    type: 'password' | 'text' | 'email';
    value: string;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
    autoComplete?: string;
}) {
    return (
        <label className="block">
            <span className="text-xs text-white/60">{label}</span>
            <input
                type={type}
                value={value}
                onChange={onChange}
                autoComplete={autoComplete}
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm outline-none focus:border-white/20"
            />
        </label>
    );
}

/** Pretty progress row with label + % + bar */
function ProgressRow({ label, pct, hint }: { label: string; pct: number; hint: string }) {
    return (
        <div>
            <div className="flex items-center justify-between text-xs text-white/60 mb-1">
                <span>{label}</span>
                <span>{pct}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                    className="h-2 rounded-full bg-white/60"
                    style={{ width: `${pct}%` }}
                />
            </div>
            <div className="mt-1 text-[11px] text-white/50">{hint}</div>
        </div>
    );
}
