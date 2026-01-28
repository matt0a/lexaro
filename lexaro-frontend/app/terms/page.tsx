'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingLinesBackground from '@/components/reactbits/FloatingLinesBackground';
import FadeInSection from '@/components/reactbits/FadeInSection';

/**
 * Terms of Service page with comprehensive legal content.
 */
export default function TermsPage() {
    const lastUpdated = "January 27, 2025";

    return (
        <div className="min-h-screen bg-black text-white">
            <FloatingLinesBackground />
            <Navbar />

            <main className="mx-auto max-w-4xl px-6 py-14">
                <FadeInSection>
                    <h1 className="text-4xl font-semibold tracking-tight">Terms of Service</h1>
                    <p className="mt-3 text-white/70">
                        Last updated: {lastUpdated}
                    </p>
                </FadeInSection>

                <FadeInSection delay={0.05}>
                    <div className="mt-10 space-y-8 rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8 text-white/75">
                        {/* Introduction */}
                        <section>
                            <h2 className="text-lg font-semibold text-white/90">1. Introduction</h2>
                            <p className="mt-2">
                                Welcome to Lexaro. These Terms of Service ("Terms") govern your access to and use of Lexaro's
                                website, applications, and services (collectively, the "Service"). By creating an account,
                                accessing, or using the Service, you agree to be bound by these Terms. If you do not agree
                                to these Terms, do not use the Service.
                            </p>
                            <p className="mt-2">
                                Lexaro provides AI-powered study tools and text-to-speech services designed to help students
                                learn more effectively. Our services include document processing, AI-assisted learning features,
                                quiz and flashcard generation, and audio conversion of text content.
                            </p>
                        </section>

                        {/* Eligibility */}
                        <section>
                            <h2 className="text-lg font-semibold text-white/90">2. Eligibility</h2>
                            <p className="mt-2">
                                You must be at least 13 years of age to use the Service. If you are under 18, you represent
                                that you have your parent or guardian's permission to use the Service. By using the Service,
                                you represent and warrant that you meet these eligibility requirements.
                            </p>
                            <p className="mt-2">
                                If you are using the Service on behalf of an organization, you represent and warrant that you
                                have the authority to bind that organization to these Terms.
                            </p>
                        </section>

                        {/* Account Registration */}
                        <section>
                            <h2 className="text-lg font-semibold text-white/90">3. Account Registration and Security</h2>
                            <p className="mt-2">
                                To access certain features of the Service, you must create an account. When you create an
                                account, you agree to:
                            </p>
                            <ul className="mt-2 list-disc list-inside space-y-1 ml-2">
                                <li>Provide accurate, current, and complete information</li>
                                <li>Maintain and promptly update your account information</li>
                                <li>Keep your password secure and confidential</li>
                                <li>Accept responsibility for all activities under your account</li>
                                <li>Notify us immediately of any unauthorized access or security breach</li>
                            </ul>
                            <p className="mt-2">
                                We reserve the right to suspend or terminate accounts that violate these Terms or that we
                                reasonably believe are being used for fraudulent or illegal purposes.
                            </p>
                        </section>

                        {/* Subscriptions and Billing */}
                        <section>
                            <h2 className="text-lg font-semibold text-white/90">4. Subscriptions and Billing</h2>
                            <p className="mt-2">
                                <strong className="text-white/90">Free Plan:</strong> We offer a free tier with limited features
                                and usage quotas. Free accounts are subject to usage limits as described on our pricing page.
                            </p>
                            <p className="mt-2">
                                <strong className="text-white/90">Paid Subscriptions:</strong> Paid plans provide additional
                                features and higher usage limits. By subscribing to a paid plan, you agree to pay the applicable
                                fees as described at the time of purchase.
                            </p>
                            <p className="mt-2">
                                <strong className="text-white/90">Automatic Renewal:</strong> Paid subscriptions automatically
                                renew at the end of each billing period (monthly or annually) unless you cancel before the
                                renewal date. You will be charged the then-current rate for your plan.
                            </p>
                            <p className="mt-2">
                                <strong className="text-white/90">Payment Processing:</strong> Payments are processed through
                                Stripe, our third-party payment processor. By providing payment information, you authorize us
                                to charge your payment method for all fees incurred. We do not store your full credit card
                                details on our servers.
                            </p>
                            <p className="mt-2">
                                <strong className="text-white/90">Cancellation:</strong> You may cancel your subscription at
                                any time through your account settings. Upon cancellation, you will retain access to paid
                                features until the end of your current billing period. No refunds will be provided for partial
                                billing periods.
                            </p>
                            <p className="mt-2">
                                <strong className="text-white/90">Price Changes:</strong> We reserve the right to change our
                                prices. If we change prices for your subscription, we will notify you in advance, and you will
                                have the option to cancel before the new prices take effect.
                            </p>
                        </section>

                        {/* User Content */}
                        <section>
                            <h2 className="text-lg font-semibold text-white/90">5. User Content</h2>
                            <p className="mt-2">
                                <strong className="text-white/90">Your Content:</strong> You retain all ownership rights to the
                                documents, text, and other content you upload to the Service ("User Content"). By uploading
                                User Content, you grant Lexaro a limited, non-exclusive license to process, store, and display
                                your content solely for the purpose of providing the Service to you.
                            </p>
                            <p className="mt-2">
                                <strong className="text-white/90">Content Restrictions:</strong> You are solely responsible for
                                your User Content. You represent and warrant that:
                            </p>
                            <ul className="mt-2 list-disc list-inside space-y-1 ml-2">
                                <li>You own or have the necessary rights to use and share your User Content</li>
                                <li>Your User Content does not infringe any third party's intellectual property rights</li>
                                <li>Your User Content does not contain illegal, harmful, or objectionable material</li>
                                <li>Your User Content does not contain malware, viruses, or malicious code</li>
                            </ul>
                            <p className="mt-2">
                                <strong className="text-white/90">AI-Generated Content:</strong> Content generated by our AI
                                features (such as quizzes, flashcards, summaries, and chat responses) is provided for
                                educational purposes only. While we strive for accuracy, AI-generated content may contain
                                errors and should not be relied upon as the sole source of information.
                            </p>
                        </section>

                        {/* Acceptable Use */}
                        <section>
                            <h2 className="text-lg font-semibold text-white/90">6. Acceptable Use Policy</h2>
                            <p className="mt-2">
                                You agree not to use the Service to:
                            </p>
                            <ul className="mt-2 list-disc list-inside space-y-1 ml-2">
                                <li>Violate any applicable laws, regulations, or third-party rights</li>
                                <li>Upload content that is illegal, defamatory, obscene, or harmful</li>
                                <li>Attempt to gain unauthorized access to the Service or other users' accounts</li>
                                <li>Interfere with or disrupt the Service or its servers</li>
                                <li>Use automated systems (bots, scrapers) to access the Service without permission</li>
                                <li>Circumvent usage limits or quota restrictions</li>
                                <li>Resell or redistribute the Service without authorization</li>
                                <li>Use the Service for academic dishonesty or to facilitate cheating</li>
                                <li>Upload content that infringes copyrights or other intellectual property rights</li>
                                <li>Harass, abuse, or harm other users</li>
                            </ul>
                            <p className="mt-2">
                                We reserve the right to investigate and take appropriate action against anyone who violates
                                this policy, including removing content and suspending or terminating accounts.
                            </p>
                        </section>

                        {/* Intellectual Property */}
                        <section>
                            <h2 className="text-lg font-semibold text-white/90">7. Intellectual Property</h2>
                            <p className="mt-2">
                                The Service, including its design, features, functionality, and content (excluding User Content),
                                is owned by Lexaro and is protected by copyright, trademark, and other intellectual property
                                laws. You may not copy, modify, distribute, sell, or lease any part of the Service without our
                                prior written consent.
                            </p>
                            <p className="mt-2">
                                "Lexaro," "Lexaro Learn," "Lexaro Voice," and our logo are trademarks of Lexaro. You may not
                                use these marks without our prior written permission.
                            </p>
                        </section>

                        {/* Third-Party Services */}
                        <section>
                            <h2 className="text-lg font-semibold text-white/90">8. Third-Party Services</h2>
                            <p className="mt-2">
                                The Service may integrate with or contain links to third-party services, including but not
                                limited to payment processors, cloud storage providers, and AI model providers. Your use of
                                third-party services is subject to their respective terms and privacy policies. We are not
                                responsible for the content, accuracy, or practices of third-party services.
                            </p>
                        </section>

                        {/* Termination */}
                        <section>
                            <h2 className="text-lg font-semibold text-white/90">9. Termination</h2>
                            <p className="mt-2">
                                <strong className="text-white/90">By You:</strong> You may terminate your account at any time
                                by contacting us or through your account settings. Upon termination, your right to use the
                                Service will immediately cease.
                            </p>
                            <p className="mt-2">
                                <strong className="text-white/90">By Us:</strong> We may suspend or terminate your access to
                                the Service at any time, with or without cause, with or without notice. Reasons for termination
                                may include violation of these Terms, fraudulent activity, or extended periods of inactivity.
                            </p>
                            <p className="mt-2">
                                <strong className="text-white/90">Effect of Termination:</strong> Upon termination, your User
                                Content may be deleted. We recommend exporting any content you wish to keep before terminating
                                your account. Provisions of these Terms that by their nature should survive termination will
                                survive, including ownership provisions, warranty disclaimers, and limitations of liability.
                            </p>
                        </section>

                        {/* Disclaimer of Warranties */}
                        <section>
                            <h2 className="text-lg font-semibold text-white/90">10. Disclaimer of Warranties</h2>
                            <p className="mt-2">
                                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER
                                EXPRESS, IMPLIED, OR STATUTORY. WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO
                                IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                            </p>
                            <p className="mt-2">
                                We do not warrant that the Service will be uninterrupted, error-free, or secure. We do not
                                warrant the accuracy, completeness, or reliability of any content, including AI-generated content.
                            </p>
                            <p className="mt-2">
                                AI-generated study materials, including quizzes, flashcards, notes, and chat responses, are
                                provided for educational assistance only. They may contain errors and should not replace
                                professional educational guidance or official course materials.
                            </p>
                        </section>

                        {/* Limitation of Liability */}
                        <section>
                            <h2 className="text-lg font-semibold text-white/90">11. Limitation of Liability</h2>
                            <p className="mt-2">
                                TO THE MAXIMUM EXTENT PERMITTED BY LAW, LEXARO AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND
                                AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
                                DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, OR GOODWILL, ARISING OUT OF
                                OR RELATED TO YOUR USE OF THE SERVICE.
                            </p>
                            <p className="mt-2">
                                OUR TOTAL LIABILITY FOR ANY CLAIMS ARISING FROM OR RELATED TO THESE TERMS OR THE SERVICE SHALL
                                NOT EXCEED THE AMOUNT YOU PAID TO US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR $100,
                                WHICHEVER IS GREATER.
                            </p>
                        </section>

                        {/* Indemnification */}
                        <section>
                            <h2 className="text-lg font-semibold text-white/90">12. Indemnification</h2>
                            <p className="mt-2">
                                You agree to indemnify, defend, and hold harmless Lexaro and its officers, directors, employees,
                                and agents from and against any claims, liabilities, damages, losses, and expenses (including
                                reasonable attorneys' fees) arising out of or related to your use of the Service, your User
                                Content, or your violation of these Terms.
                            </p>
                        </section>

                        {/* Changes to Terms */}
                        <section>
                            <h2 className="text-lg font-semibold text-white/90">13. Changes to Terms</h2>
                            <p className="mt-2">
                                We may update these Terms from time to time. If we make material changes, we will notify you
                                by email or by posting a notice on the Service prior to the changes taking effect. Your
                                continued use of the Service after the effective date of the revised Terms constitutes your
                                acceptance of the changes.
                            </p>
                        </section>

                        {/* Governing Law */}
                        <section>
                            <h2 className="text-lg font-semibold text-white/90">14. Governing Law and Disputes</h2>
                            <p className="mt-2">
                                These Terms shall be governed by and construed in accordance with the laws of the United States,
                                without regard to conflict of law principles. Any disputes arising from these Terms or the
                                Service shall be resolved through binding arbitration, except that either party may seek
                                injunctive relief in court for intellectual property infringement.
                            </p>
                        </section>

                        {/* Severability */}
                        <section>
                            <h2 className="text-lg font-semibold text-white/90">15. Severability</h2>
                            <p className="mt-2">
                                If any provision of these Terms is found to be unenforceable or invalid, that provision shall
                                be limited or eliminated to the minimum extent necessary, and the remaining provisions shall
                                remain in full force and effect.
                            </p>
                        </section>

                        {/* Entire Agreement */}
                        <section>
                            <h2 className="text-lg font-semibold text-white/90">16. Entire Agreement</h2>
                            <p className="mt-2">
                                These Terms, together with our Privacy Policy, constitute the entire agreement between you and
                                Lexaro regarding the Service and supersede all prior agreements and understandings.
                            </p>
                        </section>

                        {/* Contact */}
                        <section>
                            <h2 className="text-lg font-semibold text-white/90">17. Contact Us</h2>
                            <p className="mt-2">
                                If you have any questions about these Terms, please contact us at:
                            </p>
                            <p className="mt-2">
                                Email: <a href="mailto:swemattcodes@gmail.com" className="text-blue-400 hover:text-blue-300 transition-colors">swemattcodes@gmail.com</a>
                            </p>
                        </section>
                    </div>
                </FadeInSection>
            </main>

            <Footer />
        </div>
    );
}
