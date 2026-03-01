// components/marketing/AccentHeading.tsx
// Heading component that renders *asterisk-wrapped* words in italic serif font.
// Usage: <AccentHeading as="h2">Study Smarter *With AI*</AccentHeading>

import React from "react";

type AccentHeadingProps = {
    as?: "h1" | "h2" | "h3";
    children: string;
    className?: string;
};

/** Parse text with *accent* markers into segments. */
function parseAccent(text: string) {
    const parts: Array<{ text: string; accent: boolean }> = [];
    const regex = /\*([^*]+)\*/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push({ text: text.slice(lastIndex, match.index), accent: false });
        }
        parts.push({ text: match[1], accent: true });
        lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
        parts.push({ text: text.slice(lastIndex), accent: false });
    }

    return parts;
}

export default function AccentHeading({
    as: Tag = "h2",
    children,
    className = "",
}: AccentHeadingProps) {
    const parts = parseAccent(children);

    return (
        <Tag className={className}>
            {parts.map((part, i) =>
                part.accent ? (
                    <span key={i} className="font-serif italic text-[#228CDB]/80">
                        {part.text}
                    </span>
                ) : (
                    <span key={i}>{part.text}</span>
                )
            )}
        </Tag>
    );
}
