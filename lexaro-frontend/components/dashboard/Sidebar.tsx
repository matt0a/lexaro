'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
    Library,
    Mic,
    Settings,
    Menu,
    X,
    ArrowUpCircle,
    BookOpen,
    BarChart3,
    FolderOpen,
    MessageSquare,
    FileEdit,
    Calendar,
} from 'lucide-react';
import api from '@/lib/api';

type UsageResp = { plan: string };

function b64urlDecode(str: string) {
    try {
        const pad = str.length % 4 === 2 ? '==' : str.length % 4 === 3 ? '=' : '';
        const s = str.replace(/-/g, '+').replace(/_/g, '/') + pad;
        return atob(s);
    } catch {
        return '';
    }
}

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

    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        function onResize() {
            if (window.innerWidth >= 768) setMobileOpen(false);
        }
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    useEffect(() => {
        if (typeof document === 'undefined') return;
        if (mobileOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileOpen]);

    useEffect(() => {
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

        refreshPlan();

        const onBillingUpdated = () => refreshPlan();
        window.addEventListener('lexaro:billing-updated', onBillingUpdated);

        return () => {
            window.removeEventListener('lexaro:billing-updated', onBillingUpdated);
        };
    }, []);

    const VOICE_NAV = useMemo(
        () => [
            { href: '/dashboard', label: 'Library', Icon: Library },
            { href: '/saved-audio', label: 'Saved Audio', Icon: Mic },
            ...(planRaw?.toUpperCase() === 'FREE'
                ? [{ href: '/billing', label: 'Upgrade', Icon: ArrowUpCircle } as const]
                : []),
        ],
        [planRaw]
    );

    const LEARN_NAV = useMemo(
        () => [
            { href: '/education', label: 'Education', Icon: BookOpen },
            { href: '/education/library', label: 'Education Library', Icon: FolderOpen },
            { href: '/education/progress', label: 'Progress', Icon: BarChart3 },
            { href: '/education/chat', label: 'AI Tutor', Icon: MessageSquare },
            { href: '/education/essay', label: 'Essay Grader', Icon: FileEdit },
            { href: '/education/calendar', label: 'Study Calendar', Icon: Calendar },
        ],
        []
    );

    const initial = (email?.[0] || 'U').toUpperCase();

    return (
        <>
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

            {mobileOpen ? (
                <div
                    className="md:hidden fixed inset-0 z-[110] bg-black/45"
                    onClick={() => setMobileOpen(false)}
                />
            ) : null}

            <aside
                className={[
                    'fixed inset-y-0 left-0 z-[115] w-56 border-r border-white/10 bg-black/70 backdrop-blur-sm text-white flex flex-col',
                    'md:translate-x-0',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full',
                    'transition-transform duration-300 ease-out',
                ].join(' ')}
            >
                <div className="px-4 py-4 flex items-center justify-between">
                    <div className="text-lg font-semibold tracking-wide">Lexaro</div>

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
                    <div className="px-3 pt-2 pb-1 text-[11px] uppercase tracking-wider text-white/45">
                        Lexaro Voice
                    </div>

                    {VOICE_NAV.map(({ href, label, Icon }) => (
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

                    <div className="my-3 mx-3 h-px bg-white/10" />

                    <div className="px-3 pt-1 pb-1 text-[11px] uppercase tracking-wider text-white/45">
                        Lexaro Learn
                    </div>

                    {LEARN_NAV.map(({ href, label, Icon }) => (
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

                <div className="mt-auto border-t border-white/10 px-4 py-4">
                    <Link
                        href="/settings"
                        onClick={() => setMobileOpen(false)}
                        className="w-full flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/[0.04] transition"
                        title="Account & Settings"
                    >
                        <div className="h-9 w-9 shrink-0 rounded-full bg-white/10 grid place-items-center text-sm font-semibold">
                            {initial}
                        </div>

                        <div className="min-w-0 flex-1 text-left">
                            <div className="truncate text-sm text-white/90">{email || '—'}</div>
                            <div className="text-[11px] text-white/55">{plan}</div>
                        </div>

                        <Settings className="h-4 w-4 text-white/70" />
                    </Link>
                </div>
            </aside>
        </>
    );
}
