// lib/readalong.ts

export type SentenceSpan = {
    text: string;
    start: number;
    end: number;
    weight: number; // used for better progress mapping
};

function clamp(n: number, a: number, b: number) {
    return Math.max(a, Math.min(b, n));
}

/**
 * Splits transcript into sentence-like spans.
 * Boundaries: ., !, ?, newline.
 * Keeps punctuation on the sentence.
 *
 * Adds a "weight" so mapping audio progress → sentence is less "off"
 * for texts with uneven sentence lengths.
 */
export function splitIntoSentences(text: string): SentenceSpan[] {
    const t = (text || "").replace(/\r\n/g, "\n");
    if (!t.trim()) return [];

    const spans: SentenceSpan[] = [];
    let start = 0;

    const pushSpan = (rawStart: number, rawEnd: number) => {
        const raw = t.slice(rawStart, rawEnd);
        const chunk = raw.trim();
        if (!chunk) return;

        const leftTrim = raw.length - raw.replace(/^\s+/, "").length;
        const rightTrim = raw.length - raw.replace(/\s+$/, "").length;

        const s = rawStart + leftTrim;
        const e = rawEnd - rightTrim;
        const txt = t.slice(s, e);

        // Weight: char length with a floor so tiny sentences still count
        const w = Math.max(12, txt.replace(/\s+/g, " ").length);

        spans.push({ text: txt, start: s, end: e, weight: w });
    };

    for (let i = 0; i < t.length; i++) {
        const ch = t[i];
        const isBoundary = ch === "." || ch === "!" || ch === "?" || ch === "\n";

        if (isBoundary) {
            pushSpan(start, i + 1);
            start = i + 1;
        }
    }

    if (start < t.length) {
        pushSpan(start, t.length);
    }

    return spans;
}

/**
 * Map audio progress → sentence index using sentence weights.
 * This feels more natural than equally dividing by count.
 */
export function activeSentenceIndexByProgressWeighted(
    sentences: SentenceSpan[],
    currentSeconds: number,
    durationSeconds: number
) {
    if (!sentences.length) return -1;

    const dur = Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : 0;
    if (dur <= 0) return 0;

    const cur = Number.isFinite(currentSeconds) ? currentSeconds : 0;
    const f = clamp(cur / dur, 0, 0.999999);

    const total = sentences.reduce((a, s) => a + (s.weight || 0), 0) || 1;
    const target = f * total;

    let acc = 0;
    for (let i = 0; i < sentences.length; i++) {
        acc += sentences[i].weight || 0;
        if (acc >= target) return i;
    }

    return sentences.length - 1;
}
