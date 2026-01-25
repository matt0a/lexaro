'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Library, Mic, Settings, Menu, X, ArrowUpCircle } from 'lucide-react';
import api from '@/lib/api';
import AccountSheet from '@/components/settings/AccountSheet';

type UsageResp = { plan: string };

/** Base64URL decode with padding fix */
function b64urlDecode(str: string) {
    try {
        const pad = str.length % 4 === 2 ? '==' : str.length % 4 === 3 ? '=' : '';
        const s = str.replace(/-/g, '+').replace(/_/g, '/') + pad;
        return atob(s);
    } catch {
        return '';
    }
}

/** Extracts the JWT payload safely (or null) */
function parseJwtPayload(token: string | null): Record<string, any> | null {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;
    try {
        const json = b64urlDecode(parts[1]);
        return JSON.parse(json);
    } catch {
        return null;
    }
}

/** Heuristic for email-like value from common claims */
function emailFromClaims(claims: Record<string, any> | null): string | null {
    if (!claims) return null;
    const candidates = [claims.email, claims.preferred_username, claims.upn, claims.username, claims.sub];
    const first = candidates.find((v) => typeof v === 'string' && v.trim().length > 0) || null;
    return first;
}

function formatPlan(p?: string) {
    if (!p) return 'Free';
    const up = p.toUpperCase();
    if (up === 'FREE') return 'Free';
    if (up === 'PREMIUM') return 'Premium';
    if (up === 'BUSINESS_PLUS' || up === 'PREMIUM_PLUS' || up === 'BUSINESS') return 'Premium Plus';
    return p;
}

async function loadPlan(): Promise<{ planRaw: string; plan: string } | null> {
    try {
        const { data } = await api.get<UsageResp>('/me/usage');
        return { planRaw: data.plan, plan: formatPlan(data.plan) };
    } catch {
        return null;
    }
}

export default function Sidebar() {
    const [email, setEmail] = useState<string>('—');
    const [plan, setPlan] = useState<string>('Free');
    const [planRaw, setPlanRaw] = useState<string>('FREE');

    const [openSettings, setOpenSettings] = useState(false);

    // mobile drawer state
    const [mobileOpen, setMobileOpen] = useState(false);

    // close drawer on resize to desktop
    useEffect(() => {
        function onResize() {
            if (window.innerWidth >= 768) setMobileOpen(false);
        }
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // lock background scroll when mobile drawer open
    useEffect(() => {
        if (typeof document === 'undefined') return;
        if (mobileOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileOpen]);

    useEffect(() => {
        // read email from token
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const claims = parseJwtPayload(token);
        const e = emailFromClaims(claims);
        if (e) setEmail(e);

        const refreshPlan = async () => {
            const p = await loadPlan();
            if (p) {
                setPlan(p.plan);
                setPlanRaw(p.planRaw);
            }
        };

        // initial load
        refreshPlan();

        // ✅ refresh after billing sync
        const onBillingUpdated = () => {
            refreshPlan();
        };
        window.addEventListener('lexaro:billing-updated', onBillingUpdated);

        return () => {
            window.removeEventListener('lexaro:billing-updated', onBillingUpdated);
        };
    }, []);

    const NAV = useMemo(
        () => [
            { href: '/dashboard', label: 'Library', Icon: Library },
            // ✅ Upgrade link ONLY on free accounts
            ...(planRaw?.toUpperCase() === 'FREE'
                ? [{ href: '/billing', label: 'Upgrade', Icon: ArrowUpCircle } as const]
                : []),
            { href: '/saved-audio', label: 'Saved Audio', Icon: Mic },
        ],
        [planRaw]
    );

    const initial = (email?.[0] || 'U').toUpperCase();

    return (
        <>
            {/* Mobile hamburger (ONLY when drawer is closed) */}
            {!mobileOpen ? (
                <button
                    type="button"
                    aria-label="Open menu"
                    onClick={() => setMobileOpen(true)}
                    className="md:hidden fixed left-5 top-5 z-[120] h-11 w-11 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md grid place-items-center shadow-[0_14px_50px_rgba(0,0,0,.55)]"
                >
                    <Menu className="h-5 w-5 text-white/90" />
                </button>
            ) : null}

            {/* Mobile overlay */}
            {mobileOpen ? (
                <div
                    className="md:hidden fixed inset-0 z-[110] bg-black/45"
                    onClick={() => setMobileOpen(false)}
                />
            ) : null}

            {/* Sidebar */}
            <aside
                className={[
                    'fixed inset-y-0 left-0 z-[115] w-56 border-r border-white/10 bg-black/70 backdrop-blur-sm text-white flex flex-col',
                    // Desktop: always visible
                    'md:translate-x-0',
                    // Mobile: slide
                    mobileOpen ? 'translate-x-0' : '-translate-x-full',
                    'transition-transform duration-300 ease-out',
                ].join(' ')}
            >
                {/* Top bar */}
                <div className="px-4 py-4 flex items-center justify-between">
                    <div className="text-lg font-semibold tracking-wide">Lexaro</div>

                    {/* Mobile close button */}
                    <button
                        type="button"
                        aria-label="Close menu"
                        onClick={() => setMobileOpen(false)}
                        className="md:hidden h-9 w-9 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] grid place-items-center"
                    >
                        <X className="h-4 w-4 text-white/85" />
                    </button>
                </div>

                <nav className="flex-1 px-2">
                    {NAV.map(({ href, label, Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/85 hover:bg-white/5"
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                        </Link>
                    ))}
                </nav>

                {/* Bottom account/settings (no big box) */}
                <div className="mt-auto border-t border-white/10 px-4 py-4">
                    <button
                        onClick={() => setOpenSettings(true)}
                        className="w-full flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/[0.04] transition"
                        title="Account & Settings"
                        type="button"
                    >
                        <div className="h-9 w-9 shrink-0 rounded-full bg-white/10 grid place-items-center text-sm font-semibold">
                            {initial}
                        </div>

                        <div className="min-w-0 flex-1 text-left">
                            <div className="truncate text-sm text-white/90">{email || '—'}</div>
                            <div className="text-[11px] text-white/55">{plan}</div>
                        </div>

                        <Settings className="h-4 w-4 text-white/70" />
                    </button>
                </div>
            </aside>

            <AccountSheet
                open={openSettings}
                onClose={() => setOpenSettings(false)}
                me={{ email: email || '—', plan, planRaw }}
            />
        </>
    );
}
