/**
 * TrustStrip — horizontal social proof strip displaying key trust metrics.
 *
 * Positioned immediately below the hero section for instant credibility.
 * Desktop: 4 stats in a single row separated by thin vertical dividers.
 * Mobile: 2×2 grid (dividers become horizontal).
 */
import { TRUST_STATS } from "@/lib/marketing-data";

export default function TrustStrip() {
    return (
        <div className="border-y border-white/[0.06] py-8">
            <div className="mx-auto max-w-6xl px-4 md:px-6">
                <dl className="grid grid-cols-2 divide-x-0 divide-y divide-white/[0.06] md:grid-cols-4 md:divide-x md:divide-y-0">
                    {TRUST_STATS.map((s, i) => (
                        <div
                            key={s.label}
                            className={`py-4 text-center md:py-0 ${
                                i === 0 ? "md:pr-8" : i === TRUST_STATS.length - 1 ? "md:pl-8" : "md:px-8"
                            }`}
                        >
                            <dt className="text-3xl font-bold text-white md:text-4xl">{s.value}</dt>
                            <dd className="mt-1 text-xs text-white/40">{s.label}</dd>
                        </div>
                    ))}
                </dl>
            </div>
        </div>
    );
}
