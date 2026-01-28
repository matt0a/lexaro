'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingLinesBackground from '@/components/reactbits/FloatingLinesBackground';
import FadeInSection from '@/components/reactbits/FadeInSection';

/**
 * Privacy Policy page with comprehensive legal content.
 */
export default function PrivacyPage() {
    const lastUpdated = "January 27, 2025";

    return (
        <div className="min-h-screen bg-black text-white">
            <FloatingLinesBackground />
            <Navbar />

            <main className="mx-auto max-w-4xl px-6 py-14">
                <FadeInSection>
                    <h1 className="text-4xl font-semibold tracking-tight">Privacy Policy</h1>
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
                                Lexaro ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy
                                explains how we collect, use, disclose, and safeguard your information when you use our
                                website and services (collectively, the "Service").
                            </p>
                            <p className="mt-2">
                                By using the Service, you agree to the collection and use of information in accordance with
                                this Privacy Policy. If you do not agree with our policies and practices, please do not use
                                the Service.
                            </p>
                        </section>

                        {/* Information We Collect */}
                        <section>
                            <h2 className="text-lg font-semibold text-white/90">2. Information We Collect</h2>

                            <h3 className="mt-4 font-medium text-white/85">2.1 Information You Provide</h3>
                            <ul className="mt-2 list-disc list-inside space-y-1 ml-2">
                                <li><strong>Account Information:</strong> When you create an account, we collect your name,
                                    email address, and password.</li>
                                <li><strong>Profile Information:</strong> Any additional information you choose to add to
                                    your profile, such as a profile picture.</li>
                                <li><strong>User Content:</strong> Documents, text, and other files you upload to the
                                    Service for processing.</li>
                                <li><strong>Payment Information:</strong> When you subscribe to a paid plan, our payment
                                    processor (Stripe) collects your payment card details. We do not store your full card
                                    number on our servers.</li>
                                <li><strong>Communications:</strong> Information you provide when you contact us for
                                    support, provide feedback, or communicate with us.</li>
                            </ul>

                            <h3 className="mt-4 font-medium text-white/85">2.2 Information Collected Automatically</h3>
                            <ul className="mt-2 list-disc list-inside space-y-1 ml-2">
                                <li><strong>Usage Data:</strong> Information about how you use the Service, including
                                    features accessed, pages visited, and actions taken.</li>
                                <li><strong>Device Information:</strong> Device type, operating system, browser type,
                                    and unique device identifiers.</li>
                                <li><strong>Log Data:</strong> IP address, access times, referring URLs, and other
                                    standard log information.</li>
                                <li><strong>Cookies and Similar Technologies:</strong> We use cookies and similar
                                    tracking technologies to collect information about your browsing activities.</li>
                            </ul>

                            <h3 className="mt-4 font-medium text-white/85">2.3 Information from Third Parties</h3>
                            <p className="mt-2">
                                We may receive information about you from third-party services if you choose to link
                                or connect them to the Service (e.g., signing in with Google).
                            </p>
                        </section>

                        {/* How We Use Your Information */}
                        <section>
                            <h2 className="text-lg font-semibold text-white/90">3. How We Use Your Information</h2>
                            <p className="mt-2">We use the information we collect to:</p>
                            <ul className="mt-2 list-disc list-inside space-y-1 ml-2">
                                <li><strong>Provide the Service:</strong> Process your documents, generate study materials,
                                    convert text to speech, and deliver other core features.</li>
                                <li><strong>Manage Your Account:</strong> Create and maintain your account, process
                                    subscriptions, and handle billing.</li>
                                <li><strong>Improve the Service:</strong> Analyze usage patterns to enhance features,
                                    fix bugs, and develop new functionality.</li>
                                <li><strong>Personalize Your Experience:</strong> Remember your preferences and customize
                                    the Service to your needs.</li>
                                <li><strong>Communicate with You:</strong> Send service-related announcements, respond
                                    to inquiries, and provide customer support.</li>
                                <li><strong>Ensure Security:</strong> Monitor for fraudulent activity, prevent abuse,
                                    and protect the security of our Service and users.</li>
                                <li><strong>Comply with Legal Obligations:</strong> Meet legal requirements, respond to
                                    lawful requests, and protect our rights.</li>
                            </ul>
                        </section>

                        {/* How We Share Your Information */}
                        <section>
                            <h2 className="text-lg font-semibold text-white/90">4. How We Share Your Information</h2>
                            <p className="mt-2">
                                We do not sell your personal information. We may share your information in the following
                                circumstances:
                            </p>

                            <h3 className="mt-4 font-medium text-white/85">4.1 Service Providers</h3>
                            <p className="mt-2">
                                We share information with third-party service providers who perform services on our behalf:
                            </p>
                            <ul className="mt-2 list-disc list-inside space-y-1 ml-2">
                                <li><strong>Cloud Infrastructure:</strong> Amazon Web Services (AWS) for hosting and storage</li>
                                <li><strong>Payment Processing:</strong> Stripe for subscription billing</li>
                                <li><strong>Text-to-Speech:</strong> Amazon Polly and other TTS providers for audio generation</li>
                                <li><strong>AI Services:</strong> OpenAI and other AI providers for study features</li>
                                <li><strong>Analytics:</strong> Services that help us understand usage patterns</li>
                            </ul>
                            <p className="mt-2">
                                These providers are contractually obligated to protect your information and may only use
                                it to provide services to us.
                            </p>

                            <h3 className="mt-4 font-medium text-white/85">4.2 Legal Requirements</h3>
                            <p className="mt-2">
                                We may disclose your information if required by law, court order, or government request,
                                or if we believe disclosure is necessary to protect our rights, your safety, or the safety
                                of others.
                            </p>

                            <h3 className="mt-4 font-medium text-white/85">4.3 Business Transfers</h3>
                            <p className="mt-2">
                                If Lexaro is involved in a merger, acquisition, or sale of assets, your information may
                                be transferred as part of that transaction. We will notify you of any such change.
                            </p>

                            <h3 className="mt-4 font-medium text-white/85">4.4 With Your Consent</h3>
                            <p className="mt-2">
                                We may share your information for other purposes with your explicit consent.
                            </p>
                        </section>

                        {/* Data Retention */}
                        <section>
                            <h2 className="text-lg font-semibold text-white/90">5. Data Retention</h2>
                            <p className="mt-2">
                                We retain your information for as long as your account is active or as needed to provide
                                the Service. We may also retain certain information as required by law or for legitimate
                                business purposes, such as:
                            </p>
                            <ul className="mt-2 list-disc list-inside space-y-1 ml-2">
                                <li>Resolving disputes and enforcing our agreements</li>
                                <li>Maintaining security and preventing fraud</li>
                                <li>Complying with legal obligations</li>
                            </ul>
                            <p className="mt-2">
                                When you delete your account, we will delete or anonymize your personal information within
                                a reasonable timeframe, except where retention is required by law.
                            </p>
                        </section>

                        {/* Data Security */}
                        <section>
                            <h2 className="text-lg font-semibold text-white/90">6. Data Security</h2>
                            <p className="mt-2">
                                We implement appropriate technical and organizational measures to protect your information
                                against unauthorized access, alteration, disclosure, or destruction. These measures include:
                            </p>
                            <ul className="mt-2 list-disc list-inside space-y-1 ml-2">
                                <li>Encryption of data in transit (HTTPS/TLS)</li>
                                <li>Encryption of sensitive data at rest</li>
                                <li>Secure password hashing</li>
                                <li>Regular security assessments</li>
                                <li>Access controls and authentication</li>
                            </ul>
                            <p className="mt-2">
                                However, no method of transmission over the Internet or electronic storage is 100% secure.
                                While we strive to protect your information, we cannot guarantee absolute security.
                            </p>
                        </section>

                        {/* Your Rights and Choices */}
                        <section>
                            <h2 className="text-lg font-semibold text-white/90">7. Your Rights and Choices</h2>
                            <p className="mt-2">
                                Depending on your location, you may have certain rights regarding your personal information:
                            </p>

                            <h3 className="mt-4 font-medium text-white/85">7.1 Access and Portability</h3>
                            <p className="mt-2">
                                You can access and download your data through your account settings, or by contacting us.
                            </p>

                            <h3 className="mt-4 font-medium text-white/85">7.2 Correction</h3>
                            <p className="mt-2">
                                You can update your account information at any time through your account settings.
                            </p>

                            <h3 className="mt-4 font-medium text-white/85">7.3 Deletion</h3>
                            <p className="mt-2">
                                You can request deletion of your account and personal information by contacting us.
                                Note that some information may be retained as required by law.
                            </p>

                            <h3 className="mt-4 font-medium text-white/85">7.4 Marketing Communications</h3>
                            <p className="mt-2">
                                You can opt out of marketing emails by clicking the "unsubscribe" link in any marketing
                                email or by updating your preferences in your account settings. Note that you will still
                                receive transactional emails related to your account.
                            </p>

                            <h3 className="mt-4 font-medium text-white/85">7.5 Cookies</h3>
                            <p className="mt-2">
                                Most browsers allow you to control cookies through their settings. However, disabling
                                cookies may affect the functionality of the Service.
                            </p>
                        </section>

                        {/* Cookies and Tracking */}
                        <section>
                            <h2 className="text-lg font-semibold text-white/90">8. Cookies and Tracking Technologies</h2>
                            <p className="mt-2">
                                We use cookies and similar technologies to:
                            </p>
                            <ul className="mt-2 list-disc list-inside space-y-1 ml-2">
                                <li><strong>Essential Cookies:</strong> Required for the Service to function (e.g.,
                                    authentication, security)</li>
                                <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                                <li><strong>Analytics Cookies:</strong> Help us understand how you use the Service</li>
                            </ul>
                            <p className="mt-2">
                                We do not use cookies for third-party advertising purposes.
                            </p>
                        </section>

                        {/* Children's Privacy */}
                        <section>
                            <h2 className="text-lg font-semibold text-white/90">9. Children's Privacy</h2>
                            <p className="mt-2">
                                The Service is not intended for children under 13 years of age. We do not knowingly
                                collect personal information from children under 13. If you are a parent or guardian
                                and believe your child has provided us with personal information, please contact us
                                and we will delete such information.
                            </p>
                            <p className="mt-2">
                                Users between 13 and 18 years of age should use the Service only with parental or
                                guardian consent and supervision.
                            </p>
                        </section>

                        {/* International Data Transfers */}
                        <section>
                            <h2 className="text-lg font-semibold text-white/90">10. International Data Transfers</h2>
                            <p className="mt-2">
                                Your information may be transferred to and processed in countries other than your own.
                                These countries may have different data protection laws. By using the Service, you
                                consent to the transfer of your information to the United States and other countries
                                where we and our service providers operate.
                            </p>
                            <p className="mt-2">
                                We take appropriate safeguards to ensure your information remains protected in
                                accordance with this Privacy Policy when transferred internationally.
                            </p>
                        </section>

                        {/* California Privacy Rights */}
                        <section>
                            <h2 className="text-lg font-semibold text-white/90">11. California Privacy Rights</h2>
                            <p className="mt-2">
                                If you are a California resident, you have additional rights under the California
                                Consumer Privacy Act (CCPA):
                            </p>
                            <ul className="mt-2 list-disc list-inside space-y-1 ml-2">
                                <li><strong>Right to Know:</strong> You can request information about the categories
                                    and specific pieces of personal information we have collected about you.</li>
                                <li><strong>Right to Delete:</strong> You can request deletion of your personal
                                    information, subject to certain exceptions.</li>
                                <li><strong>Right to Non-Discrimination:</strong> We will not discriminate against
                                    you for exercising your privacy rights.</li>
                            </ul>
                            <p className="mt-2">
                                We do not sell personal information as defined by the CCPA.
                            </p>
                        </section>

                        {/* European Privacy Rights */}
                        <section>
                            <h2 className="text-lg font-semibold text-white/90">12. European Privacy Rights (GDPR)</h2>
                            <p className="mt-2">
                                If you are located in the European Economic Area (EEA), United Kingdom, or Switzerland,
                                you have additional rights under the General Data Protection Regulation (GDPR):
                            </p>
                            <ul className="mt-2 list-disc list-inside space-y-1 ml-2">
                                <li><strong>Legal Basis:</strong> We process your data based on your consent, contract
                                    performance, legal obligations, or legitimate interests.</li>
                                <li><strong>Right to Object:</strong> You can object to processing based on legitimate
                                    interests.</li>
                                <li><strong>Right to Restriction:</strong> You can request that we restrict processing
                                    of your data in certain circumstances.</li>
                                <li><strong>Right to Portability:</strong> You can receive your data in a structured,
                                    machine-readable format.</li>
                                <li><strong>Right to Withdraw Consent:</strong> Where processing is based on consent,
                                    you can withdraw it at any time.</li>
                                <li><strong>Right to Lodge a Complaint:</strong> You can lodge a complaint with a
                                    supervisory authority.</li>
                            </ul>
                        </section>

                        {/* Third-Party Links */}
                        <section>
                            <h2 className="text-lg font-semibold text-white/90">13. Third-Party Links</h2>
                            <p className="mt-2">
                                The Service may contain links to third-party websites or services. We are not responsible
                                for the privacy practices of these third parties. We encourage you to read the privacy
                                policies of any third-party services you access.
                            </p>
                        </section>

                        {/* Changes to This Policy */}
                        <section>
                            <h2 className="text-lg font-semibold text-white/90">14. Changes to This Privacy Policy</h2>
                            <p className="mt-2">
                                We may update this Privacy Policy from time to time. If we make material changes, we will
                                notify you by email or by posting a prominent notice on the Service prior to the changes
                                taking effect. The "Last updated" date at the top of this policy indicates when it was
                                last revised.
                            </p>
                            <p className="mt-2">
                                Your continued use of the Service after any changes indicates your acceptance of the
                                updated Privacy Policy.
                            </p>
                        </section>

                        {/* Contact Us */}
                        <section>
                            <h2 className="text-lg font-semibold text-white/90">15. Contact Us</h2>
                            <p className="mt-2">
                                If you have any questions, concerns, or requests regarding this Privacy Policy or our
                                data practices, please contact us at:
                            </p>
                            <p className="mt-2">
                                Email: <a href="mailto:swemattcodes@gmail.com" className="text-blue-400 hover:text-blue-300 transition-colors">swemattcodes@gmail.com</a>
                            </p>
                            <p className="mt-2">
                                We will respond to your request within a reasonable timeframe.
                            </p>
                        </section>
                    </div>
                </FadeInSection>
            </main>

            <Footer />
        </div>
    );
}
