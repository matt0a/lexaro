'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingLinesBackground from '@/components/reactbits/FloatingLinesBackground';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#07140F] text-white">
            <FloatingLinesBackground />
            <Navbar />

            <main className="mx-auto max-w-4xl px-6 py-14">
                <h1 className="text-4xl font-semibold tracking-tight">Terms of Service</h1>
                <p className="mt-3 text-white/70">
                    These Terms govern your use of Lexaro. By creating an account or using the service, you agree to these Terms.
                </p>

                <div className="mt-10 space-y-8 rounded-3xl border border-white/10 bg-white/5 p-6 text-white/75">
                    <section>
                        <h2 className="text-lg font-semibold text-white/90">1. Accounts</h2>
                        <p className="mt-2">
                            You are responsible for the security of your account and for all activity that occurs under your account.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-white/90">2. Subscriptions & Billing</h2>
                        <p className="mt-2">
                            Paid plans renew automatically unless cancelled. Prices and plan features may change over time. Your
                            subscription is managed through our payment processor.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-white/90">3. Acceptable Use</h2>
                        <p className="mt-2">
                            Do not misuse the service, attempt unauthorized access, or use Lexaro in a way that violates applicable laws.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-white/90">4. Content</h2>
                        <p className="mt-2">
                            You retain rights to your content. You grant Lexaro permission to process your content only to provide the service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-white/90">5. Termination</h2>
                        <p className="mt-2">
                            We may suspend or terminate access if these Terms are violated. You may cancel at any time.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-white/90">6. Disclaimer</h2>
                        <p className="mt-2">
                            The service is provided “as is” without warranties. We are not liable for indirect damages to the maximum extent
                            permitted by law.
                        </p>
                    </section>

                    <p className="text-xs text-white/55">
                        This is a starter Terms page so your UI flow works immediately. Replace with your finalized legal text before launch.
                    </p>
                </div>
            </main>

            <Footer />
        </div>
    );
}
