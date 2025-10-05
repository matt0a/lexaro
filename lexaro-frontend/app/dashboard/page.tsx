'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
export default function Dashboard() {
  const router = useRouter();
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
    if (!token) { router.replace('/login'); return; }
    (async () => {
      try { const res = await api.get('/me/usage'); setMe(res.data); }
      catch (e) {} finally { setLoading(false); }
    })();
  }, [router]);
  if (loading) return <div className="min-h-screen grid place-items-center">Loading…</div>;
  return (
    <div className="min-h-screen px-4 py-20 mx-auto max-w-5xl">
      <h1 className="text-3xl font-semibold">Dashboard</h1>
      <p className="text-neutral-600 dark:text-neutral-300 mt-2">Placeholder dashboard. Below is your current usage snapshot.</p>
      {me && (<div className="mt-8 grid sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-black/10 dark:border-white/10 p-5"><div className="text-sm text-neutral-500">Plan</div><div className="text-xl font-semibold mt-1">{me.plan}</div></div>
        <div className="rounded-2xl border border-black/10 dark:border-white/10 p-5"><div className="text-sm text-neutral-500">Monthly Used</div><div className="text-xl font-semibold mt-1">{me.monthlyUsed.toLocaleString()}</div></div>
        <div className="rounded-2xl border border-black/10 dark:border-white/10 p-5"><div className="text-sm text-neutral-500">Daily Used</div><div className="text-xl font-semibold mt-1">{me.dailyUsed.toLocaleString()}</div></div>
      </div>)}
    </div>
  );
}
