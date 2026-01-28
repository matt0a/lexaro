"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import FloatingLinesBackground from "@/components/reactbits/FloatingLinesBackground";
import StarBorderCard from "@/components/reactbits/StarBorderCard";
import FadeInSection from "@/components/reactbits/FadeInSection";
import ShimmerButton from "@/components/reactbits/ShimmerButton";

import {
    Mail,
    MessageSquare,
    Clock,
    ArrowRight,
    Send,
    CheckCircle2,
    HelpCircle,
} from "lucide-react";
import Link from "next/link";

/**
 * Contact page with form and support information.
 */
export default function ContactPage() {
    const [formState, setFormState] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    /**
     * Handle form submission.
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        // Simulate form submission delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // In production, this would send to an API endpoint
        console.log("Form submitted:", formState);

        setSubmitted(true);
        setSubmitting(false);
    };

    /**
     * Handle input change.
     */
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormState((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    return (
        <main className="bg-black text-white">
            <Navbar />

            {/* HERO */}
            <section className="relative overflow-hidden">
                <FloatingLinesBackground />

                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-blue-900/10 to-black/45" />
                    <div className="absolute -top-28 left-1/2 h-[540px] w-[980px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />
                    <div className="absolute top-44 left-1/3 h-[420px] w-[840px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
                </div>

                <div className="relative z-10 mx-auto max-w-6xl px-4 md:px-6 pt-24 pb-12">
                    <FadeInSection>
                        <p className="text-xs tracking-[0.25em] text-white/60 uppercase">Contact</p>
                        <h1 className="mt-3 text-4xl md:text-6xl font-semibold leading-tight">
                            Get in touch.
                        </h1>
                        <p className="mt-5 text-white/70 max-w-2xl text-lg">
                            Questions about Lexaro, need help with your account, or want to share feedback?
                            We'd love to hear from you.
                        </p>
                    </FadeInSection>
                </div>
            </section>

            {/* CONTACT FORM & INFO */}
            <section className="border-t border-white/10">
                <div className="mx-auto max-w-6xl px-4 md:px-6 py-16">
                    <div className="grid gap-12 lg:grid-cols-5">
                        {/* Form */}
                        <div className="lg:col-span-3">
                            <FadeInSection>
                                <StarBorderCard>
                                    <div className="p-6 md:p-8">
                                        {submitted ? (
                                            <div className="text-center py-8">
                                                <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                                                    <CheckCircle2 className="h-8 w-8 text-green-400" />
                                                </div>
                                                <h3 className="text-xl font-semibold mb-2">Message sent!</h3>
                                                <p className="text-white/70 mb-6">
                                                    Thanks for reaching out. We'll get back to you within 24 hours.
                                                </p>
                                                <button
                                                    onClick={() => {
                                                        setSubmitted(false);
                                                        setFormState({ name: "", email: "", subject: "", message: "" });
                                                    }}
                                                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                                >
                                                    Send another message
                                                </button>
                                            </div>
                                        ) : (
                                            <form onSubmit={handleSubmit} className="space-y-5">
                                                <div className="grid gap-5 md:grid-cols-2">
                                                    <div>
                                                        <label className="block text-sm text-white/60 mb-2">
                                                            Name
                                                        </label>
                                                        <input
                                                            type="text"
                                                            name="name"
                                                            value={formState.name}
                                                            onChange={handleChange}
                                                            required
                                                            placeholder="Your name"
                                                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-white/20 transition-colors"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm text-white/60 mb-2">
                                                            Email
                                                        </label>
                                                        <input
                                                            type="email"
                                                            name="email"
                                                            value={formState.email}
                                                            onChange={handleChange}
                                                            required
                                                            placeholder="you@example.com"
                                                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-white/20 transition-colors"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm text-white/60 mb-2">
                                                        Subject
                                                    </label>
                                                    <select
                                                        name="subject"
                                                        value={formState.subject}
                                                        onChange={handleChange}
                                                        required
                                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/20 transition-colors"
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
                                                    <label className="block text-sm text-white/60 mb-2">
                                                        Message
                                                    </label>
                                                    <textarea
                                                        name="message"
                                                        value={formState.message}
                                                        onChange={handleChange}
                                                        required
                                                        rows={5}
                                                        placeholder="How can we help?"
                                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-white/20 transition-colors resize-none"
                                                    />
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={submitting}
                                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:from-blue-600 hover:to-cyan-600 disabled:opacity-60 transition-all"
                                                >
                                                    {submitting ? (
                                                        <>
                                                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                                    </div>
                                </StarBorderCard>
                            </FadeInSection>
                        </div>

                        {/* Info Cards */}
                        <div className="lg:col-span-2 space-y-4">
                            <FadeInSection delay={0.05}>
                                <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                            <Mail className="h-5 w-5 text-blue-400" />
                                        </div>
                                        <h3 className="font-semibold">Email us</h3>
                                    </div>
                                    <p className="text-sm text-white/60 mb-2">
                                        For direct inquiries, reach us at:
                                    </p>
                                    <a
                                        href="mailto:support@lexaro.com"
                                        className="text-blue-400 hover:text-blue-300 transition-colors"
                                    >
                                        support@lexaro.com
                                    </a>
                                </div>
                            </FadeInSection>

                            <FadeInSection delay={0.1}>
                                <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="h-10 w-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                                            <Clock className="h-5 w-5 text-green-400" />
                                        </div>
                                        <h3 className="font-semibold">Response time</h3>
                                    </div>
                                    <p className="text-sm text-white/60">
                                        We typically respond within <span className="text-white">24 hours</span> during business days.
                                        Premium users get priority support.
                                    </p>
                                </div>
                            </FadeInSection>

                            <FadeInSection delay={0.15}>
                                <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                            <HelpCircle className="h-5 w-5 text-amber-400" />
                                        </div>
                                        <h3 className="font-semibold">FAQ</h3>
                                    </div>
                                    <p className="text-sm text-white/60 mb-3">
                                        Many common questions are answered in our FAQ section.
                                    </p>
                                    <Link
                                        href="/#faq"
                                        className="inline-flex items-center gap-1 text-sm text-amber-400 hover:text-amber-300 transition-colors"
                                    >
                                        View FAQ <ArrowRight className="h-3 w-3" />
                                    </Link>
                                </div>
                            </FadeInSection>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
