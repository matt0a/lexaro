'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EducationAuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [ok, setOk] = useState(false);

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) {
            router.replace('/login');
            return;
        }
        setOk(true);
    }, [router]);

    if (!ok) return null;
    return <>{children}</>;
}
