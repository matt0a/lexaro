'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Library, Mic, Settings, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
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
    if (up === 'BUSINESS_PLUS' || up === 'PREMIUM_PLUS') return 'Premium Plus';
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

function cn(...classes: Array<string | undefined | false | null>) {
    return classes.filter(Boolean).join(' ');
}

const OPEN_W = 224;   // w-56
const CLOSED_W = 72;  // comfy icon rail

export default function Sidebar() {
    const pathname = usePathname();

    const [email, setEmail] = useState<string>('—');
    const [plan, setPlan] = useState<string>('Free');
    const [planRaw, setPlanRaw] = useState<string>('FREE');
    const [openSettings, setOpenSettings] = useState(false);

    const [collapsed, setCollapsed] = useState(false);

    // apply sidebar width globally so pages + floating player can react
    function applySidebarWidth(nextCollapsed: boolean) {
        const w = nextCollapsed ? CLOSED_W : OPEN_W;
        document.documentElement.style.setProperty('--sidebar-w', `${w}px`);
        document.documentElement.style.setProperty('--sidebar-open', nextCollapsed ? '0' : '1');
    }

    useEffect(() => {
        // restore collapse state
        const saved = typeof window !== 'undefined' ? localStorage.getItem('lexaro.sidebar.collapsed') : null;
        const initialCollapsed = saved === '1';
        setCollapsed(initialCollapsed);
        applySidebarWidth(initialCollapsed);

        // read email from token
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const claims = parseJwtPayload(token);
        const e = emailFromClaims(claims);
        if (e) setEmail(e);

        // fetch plan
        loadPlan().then((p) => {
            if (p) {
                setPlan(p.plan);
                setPlanRaw(p.planRaw);
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        localStorage.setItem('lexaro.sidebar.collapsed', collapsed ? '1' : '0');
        applySidebarWidth(collapsed);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [collapsed]);

    const NAV = useMemo(
        () => [
            { href: '/dashboard', label: 'Library', Icon: Library },
            { href: '/saved-audio', label: 'Saved Audio', Icon: Mic },
        ],
        []
    );

    const initial = (email?.[0] || 'U').toUpperCase();

    return (
        <>
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-[80] border-r border-white/10 bg-black/60 backdrop-blur-sm text-white',
                    'flex flex-col',
                    collapsed ? 'w-[72px]' : 'w-[224px]'
                )}
            >
                {/* Top brand row + collapse toggle */}
                <div className={cn('px-3 py-3 flex items-center', collapsed ? 'justify-center' : 'justify-between')}>
                    {!collapsed ? <div className="text-lg font-semibold tracking-wide">Lexaro</div> : <div className="text-lg font-semibold">L</div>}

                    <button
                        type="button"
                        onClick={() => setCollapsed((v) => !v)}
                        className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition grid place-items-center"
                        aria-label={collapsed ? 'Open sidebar' : 'Collapse sidebar'}
                        title={collapsed ? 'Open sidebar' : 'Collapse sidebar'}
                    >
                        {collapsed ? <PanelLeftOpen className="h-4 w-4 text-white/85" /> : <PanelLeftClose className="h-4 w-4 text-white/85" />}
                    </button>
                </div>

                <nav className="flex-1 px-2 pt-1">
                    {NAV.map(({ href, label, Icon }) => {
                        const active = pathname === href || pathname?.startsWith(href + '/');
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                    'flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white/5 transition',
                                    active ? 'bg-white/10 text-white' : 'text-white/85',
                                    collapsed ? 'justify-center' : ''
                                )}
                                title={collapsed ? label : undefined}
                            >
                                <Icon className="h-4 w-4" />
                                {!collapsed ? <span>{label}</span> : null}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom account/settings button (NO big box card) */}
                <div className={cn('mt-auto px-2 pb-3', collapsed ? 'flex flex-col items-center gap-2' : '')}>
                    <button
                        onClick={() => setOpenSettings(true)}
                        className={cn(
                            'w-full rounded-xl hover:bg-white/5 transition flex items-center gap-3 px-3 py-2',
                            collapsed ? 'justify-center' : ''
                        )}
                        title="Account & Settings"
                    >
                        <div className="h-9 w-9 shrink-0 rounded-full bg-white/10 grid place-items-center text-sm font-semibold">
                            {initial}
                        </div>

                        {!collapsed ? (
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-sm text-white/90">{email || '—'}</div>
                                <div className="text-[11px] text-white/55 flex items-center gap-1">
                                    <Settings className="h-3 w-3" />
                                    {plan}
                                </div>
                            </div>
                        ) : null}
                    </button>
                </div>
            </aside>

            <AccountSheet open={openSettings} onClose={() => setOpenSettings(false)} me={{ email: email || '—', plan, planRaw }} />
        </>
    );
}
