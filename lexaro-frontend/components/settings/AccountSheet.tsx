'use client';

import { useEffect, useState } from 'react';
import { X, Gauge, ShieldCheck, CreditCard, Eye, EyeOff, LogOut, ArrowRight, ExternalLink } from 'lucide-react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

type Props = {
    open: boolean;
    onClose: () => void;
    me: { email: string; plan: string; planRaw: string } | null;
};

type Usage = {
    plan: string;
    unlimited: boolean;
    verified: boolean;
    monthlyCap: number;
    monthlyUsed: number;
    monthlyRemaining: number;
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

function useCountUp(target: number, durationMs = 600) {
    const [val, setVal] = useState(0);
    useEffect(() => {
        if (!Number.isFinite(target)) {
            setVal(0);
            return;
        }
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
        return () => {
            if (raf) cancelAnimationFrame(raf);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [target]);
    return val;
}

export default function AccountSheet({ open, onClose, me }: Props) {
    const router = useRouter();

    const [tab, setTab] = useState<'usage' | 'plan' | 'security'>('usage');
    const [usage, setUsage] = useState<Usage | null>(null);

    // Security form state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNew, setConfirmNew] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [secBusy, setSecBusy] = useState(false);
    const [secMsg, setSecMsg] = useState<string>('');
    const [secErr, setSecErr] = useState<string>('');

    const [billingBusy, setBillingBusy] = useState(false);
    const [billingErr, setBillingErr] = useState<string>('');

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
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNew('');
            setSecBusy(false);
            setSecMsg('');
            setSecErr('');
            setBillingBusy(false);
            setBillingErr('');
            setTab('usage');
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

            const res = await api.post<{
                id: number;
                email: string;
                token?: string | null;
                plan?: string;
            }>('/auth/change-password', {
                currentPassword,
                newPassword,
            });

            const token = res.data?.token ?? null;
            if (token && typeof window !== 'undefined') {
                localStorage.setItem('token', token);
            }

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

    const handleLogout = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
    };

    const friendlyPlan = formatPlan(me?.planRaw || usage?.plan);
    const planRaw = (me?.planRaw || usage?.plan || 'FREE').toUpperCase();
    const isFree = planRaw === 'FREE';

    const isUnlimited = !!usage?.unlimited || (usage?.monthlyCap ?? 0) > 1e15;
    const monthlyCap = usage?.monthlyCap ?? Number.POSITIVE_INFINITY;
    const monthlyUsed = usage?.monthlyUsed ?? 0;
    const monthlyPct =
        !usage || isUnlimited || monthlyCap === 0 ? 0 : Math.min(100, Math.round((monthlyUsed / monthlyCap) * 100));
    const animMonthly = useCountUp(monthlyUsed);

    const goToSwitchPlans = () => {
        onClose();
        router.push('/billing');
    };

    const openBillingPortal = async () => {
        setBillingErr('');
        setBillingBusy(true);
        try {
            const { data } = await api.post<{ url?: string }>('/billing/portal', {});
            if (data?.url) {
                window.location.href = data.url;
                return;
            }
            setBillingErr('Could not open subscription manager.');
        } catch (e: any) {
            setBillingErr(e?.response?.data?.message || e?.message || 'Could not open subscription manager.');
        } finally {
            setBillingBusy(false);
        }
    };

    return (
        <div
            className={['fixed inset-0 z-50 transition', open ? 'pointer-events-auto' : 'pointer-events-none'].join(' ')}
            aria-hidden={!open}
        >
            {/* Background dim */}
            <div
                className={['absolute inset-0 bg-black/50 transition-opacity', open ? 'opacity-100' : 'opacity-0'].join(' ')}
                onClick={onClose}
            />
            {/* Slide-over sheet */}
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
                    <TabButton active={tab === 'usage'} onClick={() => setTab('usage')} icon={<Gauge className="h-4 w-4" />}>
                        Usage
                    </TabButton>
                    <TabButton
                        active={tab === 'plan'}
                        onClick={() => setTab('plan')}
                        icon={<CreditCard className="h-4 w-4" />}
                    >
                        Plan
                    </TabButton>
                    <TabButton
                        active={tab === 'security'}
                        onClick={() => setTab('security')}
                        icon={<ShieldCheck className="h-4 w-4" />}
                    >
                        Security
                    </TabButton>
                </div>

                {/* Content + logout at bottom */}
                <div className="px-5 py-4 flex flex-col h-[calc(100%-96px)]">
                    <div className="flex-1 overflow-y-auto">
                        {tab === 'usage' && (
                            <div className="space-y-5">
                                <h3 className="text-lg font-medium">Your usage</h3>

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
                                    <div className="text-sm text-white/60">Your plan is unlimited. Usage is tracked for your reference.</div>
                                )}
                            </div>
                        )}

                        {tab === 'plan' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Plan & Billing</h3>

                                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                                    <div className="text-xs text-white/60">Current plan</div>
                                    <div className="mt-1 text-lg font-semibold">{friendlyPlan}</div>
                                </div>

                                {isFree ? (
                                    <button
                                        onClick={goToSwitchPlans}
                                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                                    >
                                        Switch plan <ArrowRight className="h-4 w-4" />
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={openBillingPortal}
                                            disabled={billingBusy}
                                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-60"
                                        >
                                            {billingBusy ? 'Opening…' : 'Manage subscription'}
                                            <ExternalLink className="h-4 w-4" />
                                        </button>

                                        {!!billingErr && <div className="text-sm text-red-300">{billingErr}</div>}

                                        <div className="text-xs text-white/55">
                                            Manage subscription lets you change plan or cancel.
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {tab === 'security' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Change password</h3>

                                <PasswordField
                                    label="Current password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    visible={showCurrent}
                                    onToggle={() => setShowCurrent(!showCurrent)}
                                />
                                <PasswordField
                                    label="New password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    visible={showNew}
                                    onToggle={() => setShowNew(!showNew)}
                                />
                                <PasswordField
                                    label="Confirm new password"
                                    value={confirmNew}
                                    onChange={(e) => setConfirmNew(e.target.value)}
                                    visible={showConfirm}
                                    onToggle={() => setShowConfirm(!showConfirm)}
                                />

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

                    {/* logout button */}
                    <div className="pt-4 border-t border-white/5 mt-4">
                        <button
                            onClick={handleLogout}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-white/80 hover:bg-white/[0.06]"
                        >
                            <LogOut className="h-4 w-4" />
                            Log out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TabButton({
                       active,
                       onClick,
                       children,
                       icon,
                   }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
    icon: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            className={[
                'inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm border',
                active ? 'bg-white/10 border-white/20' : 'bg-transparent border-white/10 hover:bg-white/5',
            ].join(' ')}
        >
            {icon}
            {children}
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

function PasswordField({
                           label,
                           value,
                           onChange,
                           visible,
                           onToggle,
                       }: {
    label: string;
    value: string;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
    visible: boolean;
    onToggle: () => void;
}) {
    return (
        <label className="block relative">
            <span className="text-xs text-white/60">{label}</span>
            <input
                type={visible ? 'text' : 'password'}
                value={value}
                onChange={onChange}
                autoComplete="new-password"
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 pr-9 text-sm outline-none focus:border-white/20"
            />
            <button
                type="button"
                onClick={onToggle}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
                tabIndex={-1}
            >
                {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
        </label>
    );
}

function ProgressRow({ label, pct, hint }: { label: string; pct: number; hint: string }) {
    return (
        <div>
            <div className="flex items-center justify-between text-xs text-white/60 mb-1">
                <span>{label}</span>
                <span>{pct}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <div className="h-2 rounded-full bg-white/60" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-1 text-[11px] text-white/50">{hint}</div>
        </div>
    );
}
