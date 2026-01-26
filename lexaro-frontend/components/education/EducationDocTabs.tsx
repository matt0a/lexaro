'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

export default function EducationDocTabs({ docId }: { docId: number }) {
    const pathname = usePathname();

    const tabs = [
        { key: 'chat', label: 'Chat', href: `/education/doc/${docId}/chat` },
        { key: 'notes', label: 'Notes', href: `/education/doc/${docId}/notes` },
        { key: 'flashcards', label: 'Flashcards', href: `/education/doc/${docId}/flashcards` },
        { key: 'quizzes', label: 'Quizzes', href: `/education/doc/${docId}/quizzes` },
        { key: 'sources', label: 'Sources', href: `/education/doc/${docId}/sources` },
    ];

    const isActive = (href: string) => pathname === href;

    return (
        <div className="flex flex-wrap gap-2">
            {tabs.map((t) => (
                <Link
                    key={t.key}
                    href={t.href}
                    className={cn(
                        'px-4 py-2 rounded-xl border transition text-sm font-semibold',
                        isActive(t.href)
                            ? 'bg-[#009FFD] text-black border-transparent'
                            : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                    )}
                >
                    {t.label}
                </Link>
            ))}
        </div>
    );
}
