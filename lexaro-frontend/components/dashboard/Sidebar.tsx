'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Library, Mic, Settings } from 'lucide-react';
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
    const candidates = [
        claims.email,
        claims.preferred_username,
        claims.upn,
        claims.username,
        claims.sub,
    ];
    const first = candidates.find((v) => typeof v === 'string' && v.trim().length > 0) || null;
    return first;
}

function formatPlan(p?: string) {
    if (!p) return 'Free';
    const up = p.toUpperCase();
    if (up === 'FREE') return 'Free';
    if (up === 'PREMIUM') return 'Premium';
    if (up === 'BUSINESS_PLUS' || up === 'PREMIUM_PLUS') return 'Premium Plus';
    return p; // fallback
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

    useEffect(() => {
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
    }, []);

    const NAV = [
        { href: '/dashboard', label: 'Library', Icon: Library },
        { href: '/saved-audio', label: 'Saved Audio', Icon: Mic },
    ];

    const initial = (email?.[0] || 'U').toUpperCase();

    return (
        <>
            <aside className="fixed inset-y-0 left-0 w-56 border-r border-white/10 bg-black/60 backdrop-blur-sm text-white flex flex-col">
                <div className="px-4 py-4 text-lg font-semibold tracking-wide">Lexaro</div>

                <nav className="flex-1 px-2">
                    {NAV.map(({ href, label, Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/85 hover:bg-white/5"
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                        </Link>
                    ))}
                </nav>

                {/* User box at bottom */}
                <button
                    onClick={() => setOpenSettings(true)}
                    className="m-3 mt-auto flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-left hover:bg-white/[0.06]"
                    title="Account & Settings"
                >
                    <div className="h-8 w-8 shrink-0 rounded-full bg-white/10 grid place-items-center text-sm font-semibold">
                        {initial}
                    </div>
                    <div className="min-w-0">
                        <div className="truncate text-sm">{email || '—'}</div>
                        <div className="text-[11px] text-white/60 flex items-center gap-1">
                            <Settings className="h-3 w-3" /> {plan}
                        </div>
                    </div>
                </button>
            </aside>

            <AccountSheet
                open={openSettings}
                onClose={() => setOpenSettings(false)}
                me={{ email: email || '—', plan, planRaw }}
            />
        </>
    );
}
