'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

export default function PromoBanner() {
    return (
        <section className="reveal">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="mx-auto max-w-6xl px-4 sm:px-4 md:px-6 lg:px-8"
            >
                <div className="relative overflow-hidden rounded-[2rem] bg-white text-black shadow-xl">
                    <div className="grid grid-cols-1 gap-6 p-8 sm:grid-cols-2 sm:p-12">
                        {/* Left copy */}
                        <div className="flex flex-col justify-center">
                            <h3 className="text-4xl font-semibold leading-tight sm:text-5xl">
                                Cut Your Reading<br />Time in Half
                            </h3>
                            <p className="mt-5 text-lg text-black/70">
                                Start free and see how easy reading can be.
                            </p>

                            <div className="mt-8">
                                <a
                                    href="/get-started"
                                    className="inline-flex items-center rounded-xl bg-black px-5 py-3 text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/50"
                                >
                                    Try for Free
                                </a>
                            </div>
                        </div>

                        {/* Illustration */}
                        <div className="relative h-[220px] sm:h-[320px]">
                            <Image
                                src="/images/promo/book-audio.png" // <-- add this file
                                alt="Reading with audio"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                    </div>

                    {/* Floating avatar chip (bottom-right) */}
                    <div className="pointer-events-none absolute -bottom-6 -right-4">
                        <div className="relative h-24 w-24 overflow-hidden rounded-full shadow-2xl ring-4 ring-white">
                            <Image
                                src="/images/avatars/male-1.png" // placeholder until you swap
                                alt="User"
                                fill
                                className="object-cover"
                            />
                        </div>
                    </div>
                </div>
            </motion.div>
        </section>
    );
}
