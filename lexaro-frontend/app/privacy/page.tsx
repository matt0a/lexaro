'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingLinesBackground from '@/components/reactbits/FloatingLinesBackground';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[#07140F] text-white">
            <FloatingLinesBackground />
            <Navbar />

            <main className="mx-auto max-w-4xl px-6 py-14">
                <h1 className="text-4xl font-semibold tracking-tight">Privacy Policy</h1>
                <p className="mt-3 text-white/70">
                    This Privacy Policy explains what we collect, how we use it, and your choices.
                </p>

                <div className="mt-10 space-y-8 rounded-3xl border border-white/10 bg-white/5 p-6 text-white/75">
                    <section>
                        <h2 className="text-lg font-semibold text-white/90">1. Data we collect</h2>
                        <p className="mt-2">
                            We collect account details (like email), usage information (like credits used), and content you upload or generate
                            so we can provide the service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-white/90">2. How we use data</h2>
                        <p className="mt-2">
                            We use your data to operate Lexaro, improve features, prevent abuse, and provide support.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-white/90">3. Payments</h2>
                        <p className="mt-2">
                            Payments are processed by our payment provider. We do not store full card details on Lexaro servers.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-white/90">4. Your choices</h2>
                        <p className="mt-2">
                            You can update your account details, cancel subscriptions, and request deletion where applicable.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-white/90">5. Contact</h2>
                        <p className="mt-2">Contact us if you have privacy questions or requests.</p>
                    </section>

                    <p className="text-xs text-white/55">
                        This is a starter Privacy Policy so your UI flow works immediately. Replace with your finalized legal text before launch.
                    </p>
                </div>
            </main>

            <Footer />
        </div>
    );
}
