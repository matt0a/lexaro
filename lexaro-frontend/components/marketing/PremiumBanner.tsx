// components/marketing/PremiumBanner.tsx
import React from "react";

export default function PremiumBanner() {
    return (
        <section className="px-4">
            <div className="mx-auto mt-16 max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 p-8 text-white">
                <div className="grid items-center gap-6 md:grid-cols-2">
                    <div>
                        <h3 className="text-2xl font-bold">Upgrade to Premium or Premium+</h3>
                        <p className="mt-2 text-white/90">
                            Bigger monthly word limits, natural & studio voices, and priority support.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2 text-sm">
                            <span className="rounded-full bg-white/15 px-3 py-1">200+ voices</span>
                            <span className="rounded-full bg-white/15 px-3 py-1">60+ languages</span>
                            <span className="rounded-full bg-white/15 px-3 py-1">5× speed</span>
                            <span className="rounded-full bg-white/15 px-3 py-1">MP3 export</span>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-white/10 p-6 text-center">
                        <div className="text-sm opacity-90">Monthly word limits</div>
                        <div className="mt-2 grid grid-cols-2 gap-4">
                            <div className="rounded-xl bg-white/10 p-4">
                                <div className="text-4xl font-extrabold">150k</div>
                                <div className="text-xs opacity-90">Premium</div>
                            </div>
                            <div className="rounded-xl bg-white p-4 text-gray-900">
                                <div className="text-4xl font-extrabold">350k</div>
                                <div className="text-xs opacity-70">Premium+</div>
                            </div>
                        </div>
                        {/* Button removed as requested */}
                    </div>
                </div>
            </div>
        </section>
    );
}
