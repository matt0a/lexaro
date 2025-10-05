import type { Config } from 'tailwindcss';

export default {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                bg: '#0a0a0a',
                surface: '#111214',
                card: '#0f0f12',
                muted: '#9ca3af',
                accent: {
                    DEFAULT: '#228CDB',
                    600: '#1b6fb0',
                    700: '#155b91',
                },
            },
            boxShadow: {
                glow:
                    '0 0 0 1px rgba(255,255,255,0.06), 0 10px 30px rgba(0,0,0,0.55), 0 0 40px rgba(34,140,219,0.15)',
                lift:
                    '0 12px 30px rgba(0,0,0,.45), 0 6px 15px rgba(34,140,219,.15)',
            },
            borderRadius: {
                xl2: '1.25rem',
            },
            fontFamily: {
                // Nice Apple-like stack (uses Inter if present)
                sans: [
                    'Inter var',
                    'ui-sans-serif',
                    'system-ui',
                    '-apple-system',
                    'Segoe UI',
                    'Roboto',
                    'Helvetica Neue',
                    'Arial',
                    'Noto Sans',
                    'Apple Color Emoji',
                    'Segoe UI Emoji',
                    'Segoe UI Symbol',
                ],
            },
            container: {
                center: true,
                padding: '1rem',
            },
        },
    },
    darkMode: 'class',
    plugins: [],
} satisfies Config;
