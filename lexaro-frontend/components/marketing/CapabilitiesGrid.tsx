// components/marketing/CapabilitiesGrid.tsx
// 3×3 grid showing supported formats and features. Monochrome icons only.

import React from "react";
import {
    FileText,
    ScanLine,
    Headphones,
    MessageSquare,
    LayoutGrid,
    CheckCircle2,
    BookOpen,
    TrendingUp,
} from "lucide-react";

const ITEMS = [
    { label: "PDF", icon: FileText },
    { label: "DOCX", icon: FileText },
    { label: "OCR / Scans", icon: ScanLine },
    { label: "Text-to-Speech", icon: Headphones },
    { label: "AI Chat", icon: MessageSquare },
    { label: "Flashcards", icon: LayoutGrid },
    { label: "Quizzes", icon: CheckCircle2 },
    { label: "Notes", icon: BookOpen },
    { label: "Progress", icon: TrendingUp },
];

export default function CapabilitiesGrid() {
    return (
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            {ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                    <div
                        key={item.label}
                        className="flex flex-col items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]"
                    >
                        <Icon className="h-6 w-6 text-white/40" />
                        <span className="text-xs text-white/50 text-center">{item.label}</span>
                    </div>
                );
            })}
        </div>
    );
}
