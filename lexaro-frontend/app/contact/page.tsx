"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Clock, HelpCircle, Send, CheckCircle2, ArrowRight } from "lucide-react";

import MarketingShell from "@/components/marketing/MarketingShell";
import GlassNavbar from "@/components/marketing/GlassNavbar";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import SectionPill from "@/components/marketing/SectionPill";
import AccentHeading from "@/components/marketing/AccentHeading";
import GlassCard from "@/components/marketing/GlassCard";
import CTASection from "@/components/marketing/CTASection";
import FadeInSection from "@/components/reactbits/FadeInSection";

export default function ContactPage() {
    const [formState, setFormState] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        console.log("Form submitted:", formState);
        setSubmitted(true);
        setSubmitting(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormState((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <MarketingShell>
            <GlassNavbar />

            {/* Hero */}
            <section className="pt-28 pb-12">
                <div className="mx-auto max-w-6xl px-4 md:px-6">
                    <FadeInSection>
                        <div className="text-center">
                            <SectionPill icon={<Mail className="h-3.5 w-3.5" />}>Contact</SectionPill>
                            <AccentHeading as="h1" className="mt-5 text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight">
                                {"Get in *Touch*"}
                            </AccentHeading>
                            <p className="mt-5 text-white/60 max-w-2xl mx-auto text-lg">
                                Questions about Lexaro, need help with your account, or want to share feedback? We'd love to hear from you.
                            </p>
                        </div>
                    </FadeInSection>
                </div>
            </section>

            {/* Form + Info */}
            <section className="pb-20">
                <div className="mx-auto max-w-6xl px-4 md:px-6">
                    <div className="grid gap-10 lg:grid-cols-5">
                        {/* Form */}
                        <div className="lg:col-span-3">
                            <FadeInSection>
                                <GlassCard hoverable={false} className="p-6 md:p-8">
                                    {submitted ? (
                                        <div className="text-center py-8">
                                            <div className="h-16 w-16 rounded-full border border-white/[0.08] flex items-center justify-center mx-auto mb-4">
                                                <CheckCircle2 className="h-8 w-8 text-white/70" />
                                            </div>
                                            <h3 className="text-xl font-semibold mb-2">Message sent!</h3>
                                            <p className="text-white/60 mb-6">
                                                Thanks for reaching out. We'll get back to you within 24 hours.
                                            </p>
                                            <button
                                                onClick={() => {
                                                    setSubmitted(false);
                                                    setFormState({ name: "", email: "", subject: "", message: "" });
                                                }}
                                                className="text-sm text-white/50 hover:text-white transition-colors"
                                            >
                                                Send another message
                                            </button>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSubmit} className="space-y-5">
                                            <div className="grid gap-5 md:grid-cols-2">
                                                <div>
                                                    <label className="block text-sm text-white/50 mb-2">Name</label>
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        value={formState.name}
                                                        onChange={handleChange}
                                                        required
                                                        placeholder="Your name"
                                                        className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder-white/30 focus:outline-none focus:border-[#228CDB]/30 focus:ring-2 focus:ring-[#228CDB]/20 transition-colors"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-white/50 mb-2">Email</label>
                                                    <input
                                                        type="email"
                                                        name="email"
                                                        value={formState.email}
                                                        onChange={handleChange}
                                                        required
                                                        placeholder="you@example.com"
                                                        className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder-white/30 focus:outline-none focus:border-[#228CDB]/30 focus:ring-2 focus:ring-[#228CDB]/20 transition-colors"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm text-white/50 mb-2">Subject</label>
                                                <select
                                                    name="subject"
                                                    value={formState.subject}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white focus:outline-none focus:border-[#228CDB]/30 focus:ring-2 focus:ring-[#228CDB]/20 transition-colors"
                                                >
                                                    <option value="" className="bg-black">Select a topic</option>
                                                    <option value="general" className="bg-black">General inquiry</option>
                                                    <option value="support" className="bg-black">Technical support</option>
                                                    <option value="billing" className="bg-black">Billing question</option>
                                                    <option value="feedback" className="bg-black">Product feedback</option>
                                                    <option value="partnership" className="bg-black">Partnership inquiry</option>
                                                    <option value="other" className="bg-black">Other</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm text-white/50 mb-2">Message</label>
                                                <textarea
                                                    name="message"
                                                    value={formState.message}
                                                    onChange={handleChange}
                                                    required
                                                    rows={5}
                                                    placeholder="How can we help?"
                                                    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors resize-none"
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={submitting}
                                                className="w-full flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-60"
                                            >
                                                {submitting ? (
                                                    <>
                                                        <div className="h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                                        Sending...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="h-4 w-4" />
                                                        Send message
                                                    </>
                                                )}
                                            </button>
                                        </form>
                                    )}
                                </GlassCard>
                            </FadeInSection>
                        </div>

                        {/* Info Cards */}
                        <div className="lg:col-span-2 space-y-4">
                            <FadeInSection delay={0.05}>
                                <GlassCard className="p-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08]">
                                            <Mail className="h-5 w-5 text-white/50" />
                                        </div>
                                        <h3 className="font-semibold">Email us</h3>
                                    </div>
                                    <p className="text-sm text-white/50 mb-2">For direct inquiries, reach us at:</p>
                                    <a href="mailto:support@lexaro.com" className="text-sm text-white/80 hover:text-white transition-colors">
                                        support@lexaro.com
                                    </a>
                                </GlassCard>
                            </FadeInSection>

                            <FadeInSection delay={0.1}>
                                <GlassCard className="p-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08]">
                                            <Clock className="h-5 w-5 text-white/50" />
                                        </div>
                                        <h3 className="font-semibold">Response time</h3>
                                    </div>
                                    <p className="text-sm text-white/50">
                                        We typically respond within <span className="text-white/80">24 hours</span> during business days. Premium users get priority support.
                                    </p>
                                </GlassCard>
                            </FadeInSection>

                            <FadeInSection delay={0.15}>
                                <GlassCard className="p-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08]">
                                            <HelpCircle className="h-5 w-5 text-white/50" />
                                        </div>
                                        <h3 className="font-semibold">FAQ</h3>
                                    </div>
                                    <p className="text-sm text-white/50 mb-3">
                                        Many common questions are answered in our FAQ section.
                                    </p>
                                    <Link href="/#faq" className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-white transition-colors">
                                        View FAQ <ArrowRight className="h-3 w-3" />
                                    </Link>
                                </GlassCard>
                            </FadeInSection>
                        </div>
                    </div>
                </div>
            </section>

            <CTASection />
            <MarketingFooter />
        </MarketingShell>
    );
}
