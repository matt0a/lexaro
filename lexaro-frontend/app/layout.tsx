import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Lexaro — Your Documents. Your Voice.", description: "Read aloud, translate, and focus. A beautiful, simple way to experience your documents." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body className="min-h-screen bg-white text-black dark:bg-black dark:text-white">{children}</body></html>);
}
