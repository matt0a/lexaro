'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Library, Mic } from 'lucide-react';

const NAV = [
    { href: '/dashboard', label: 'Library', Icon: Library },
    { href: '/saved-audio', label: 'Saved Audio', Icon: Mic },
];

export default function Sidebar() {
    const pathname = usePathname();
    return (
        <aside className="fixed inset-y-0 left-0 w-56 border-r border-white/10 bg-black/95 text-white z-40">
            <div className="h-16 flex items-center px-4 border-b border-white/10">
                <div className="text-lg font-semibold">Lexaro</div>
            </div>

            <nav className="p-2 space-y-1">
                {NAV.map(({ href, label, Icon }) => {
                    const active = pathname === href;
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={[
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition',
                                active ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white',
                            ].join(' ')}
                        >
                            <Icon className="h-4 w-4" />
                            <span>{label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10 text-xs text-white/50">
                © {new Date().getFullYear()} Lexaro
            </div>
        </aside>
    );
}
