import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-sans",
    display: "swap",
});

const instrumentSerif = Instrument_Serif({
    weight: "400",
    style: "italic",
    subsets: ["latin"],
    variable: "--font-serif",
    display: "swap",
});

export const metadata: Metadata = {
    title: "Lexaro — Your Documents. Your Voice.",
    description: "Read aloud, translate, and focus. A beautiful, simple way to experience your documents.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={`${inter.variable} ${instrumentSerif.variable}`}>
        <body
            className="min-h-screen bg-white text-black dark:bg-black dark:text-white"
            style={
                {
                    // default open sidebar width; Sidebar.tsx will overwrite after mount
                    ["--sidebar-w" as any]: "224px",
                    ["--sidebar-open" as any]: "1",
                } as React.CSSProperties
            }
        >
        <Providers>
            {children}
        </Providers>
        </body>
        </html>
    );
}
