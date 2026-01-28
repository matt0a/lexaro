import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Github, Linkedin, Mail } from 'lucide-react';

/**
 * Footer link group configuration.
 */
const FOOTER_LINKS = {
    product: [
        { label: 'Features', href: '/about/features' },
        { label: 'Pricing', href: '/plans' },
        { label: 'Get Started', href: '/get-started' },
    ],
    company: [
        { label: 'About', href: '/about' },
        { label: 'Contact', href: '/contact' },
    ],
    legal: [
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Privacy Policy', href: '/privacy' },
    ],
};

/**
 * Social media links.
 */
const SOCIAL_LINKS = [
    { icon: Instagram, href: 'https://www.instagram.com/lexaroapp?igsh=MXFxcWEyOWcxZG02Yg==', label: 'Instagram' },
    { icon: Github, href: 'https://github.com/matt0a', label: 'GitHub' },
    { icon: Linkedin, href: 'https://www.linkedin.com/in/matthias-arrindell-b07596170', label: 'LinkedIn' },
    { icon: Mail, href: 'mailto:swemattcodes@gmail.com', label: 'Email' },
];

/**
 * Enhanced Footer component with navigation links, social media, and legal links.
 */
export default function Footer() {
    return (
        <footer className="border-t border-white/10 bg-black mt-24">
            <div className="mx-auto max-w-6xl px-4 md:px-6 py-14">
                {/* Main Grid */}
                <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Brand Column */}
                    <div className="sm:col-span-2 lg:col-span-1">
                        <Link href="/" className="inline-flex items-center gap-2 group">
                            <Image
                                src="/logo.png"
                                alt="Lexaro"
                                width={32}
                                height={32}
                                className="h-8 w-8 rounded-lg"
                            />
                            <span className="text-lg font-semibold text-white group-hover:text-white/80 transition-colors">
                                Lexaro
                            </span>
                        </Link>
                        <p className="mt-4 text-sm text-white/60 max-w-xs">
                            Study smarter, not harder. AI-powered study tools and premium text-to-speech for students.
                        </p>

                        {/* Social Links */}
                        <div className="mt-5 flex items-center gap-3">
                            {SOCIAL_LINKS.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="h-9 w-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center
                                               text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
                                    aria-label={social.label}
                                >
                                    <social.icon className="h-4 w-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Product Column */}
                    <div>
                        <h3 className="text-sm font-semibold text-white mb-4">Product</h3>
                        <ul className="space-y-3">
                            {FOOTER_LINKS.product.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-white/60 hover:text-white transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company Column */}
                    <div>
                        <h3 className="text-sm font-semibold text-white mb-4">Company</h3>
                        <ul className="space-y-3">
                            {FOOTER_LINKS.company.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-white/60 hover:text-white transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal Column */}
                    <div>
                        <h3 className="text-sm font-semibold text-white mb-4">Legal</h3>
                        <ul className="space-y-3">
                            {FOOTER_LINKS.legal.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-white/60 hover:text-white transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-white/50">
                        © {new Date().getFullYear()} Lexaro. All rights reserved.
                    </p>
                    <p className="text-xs text-white/40">
                        Made with care for students everywhere.
                    </p>
                </div>
            </div>
        </footer>
    );
}
