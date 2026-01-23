export type SentenceSpan = {
    text: string;
    start: number; // char start in original transcript
    end: number;   // char end in original transcript
    weight: number; // "spoken time units"
};

/**
 * Tweak these if you want tighter/looser behavior.
 * These are "pause units" added on top of word count.
 */
const DEFAULT_PAUSE_UNITS = {
    comma: 0.35,        // ,
    semicolon: 0.45,    // ;
    colon: 0.45,        // :
    endStop: 0.90,      // . ! ?
    ellipsis: 1.10,     // ... or …
    quote: 0.10,        // " ' “ ” ‘ ’
    dash: 0.18,         // — – --
    newline: 1.20,      // \n (line break)
    paragraph: 1.60,    // blank line(s) \n\n+
};

function clamp(n: number, a: number, b: number) {
    return Math.max(a, Math.min(b, n));
}

function countMatches(str: string, re: RegExp) {
    const m = str.match(re);
    return m ? m.length : 0;
}

/**
 * Words + punctuation pauses approximation.
 * This is the core of "Option 1".
 */
export function computeSentenceUnits(
    text: string,
    pause = DEFAULT_PAUSE_UNITS
): number {
    const t = text ?? "";
    const trimmed = t.trim();
    if (!trimmed) return 0;

    // Words: count "word-like" tokens (handles contractions)
    const words = trimmed.match(/[A-Za-z0-9]+(?:'[A-Za-z0-9]+)?/g)?.length ?? 0;

    // Punctuation counts
    const commas = countMatches(t, /,/g);
    const semicolons = countMatches(t, /;/g);
    const colons = countMatches(t, /:/g);

    // Ellipses: "..." or unicode …
    const ellipses = countMatches(t, /\.{3,}|…/g);

    // End stops: . ! ? BUT avoid counting dots inside ellipses
    // We'll count all .!? then subtract ellipsis dot groups approx.
    const rawEndStops = countMatches(t, /[.!?]/g);
    const endStops = Math.max(0, rawEndStops - ellipses * 3);

    // Quotes
    const quotes = countMatches(t, /["'“”‘’]/g);

    // Dashes: em dash, en dash, or double hyphen
    const dashes = countMatches(t, /—|–|--/g);

    // Newlines: treat paragraph breaks heavier than single newline
    const paragraphBreaks = countMatches(t, /\n{2,}/g);
    const singleNewlines = countMatches(t, /\n/g) - paragraphBreaks * 2; // rough
    const newlines = Math.max(0, singleNewlines);

    // Weighted pause units
    const pauseUnits =
        commas * pause.comma +
        semicolons * pause.semicolon +
        colons * pause.colon +
        endStops * pause.endStop +
        ellipses * pause.ellipsis +
        quotes * pause.quote +
        dashes * pause.dash +
        newlines * pause.newline +
        paragraphBreaks * pause.paragraph;

    /**
     * Optional: tiny length component (helps when sentences have same word counts
     * but very different syllable/length; keep it small)
     */
    const lengthNudge = clamp(trimmed.length / 220, 0, 0.35);

    // Final units
    return Math.max(0.001, words + pauseUnits + lengthNudge);
}

/**
 * Sentence splitter:
 * - Keeps punctuation at end of sentence
 * - Splits on . ! ? and on newlines (but preserves them in weights)
 */
export function splitIntoSentences(transcript: string): SentenceSpan[] {
    const text = transcript ?? "";
    const out: SentenceSpan[] = [];

    let start = 0;

    // We split at:
    // - end punctuation followed by whitespace/newline OR end of string
    // - newline(s) as hard boundaries
    //
    // We'll scan char by char to preserve indices.
    const pushSpan = (s: number, e: number) => {
        const slice = text.slice(s, e);
        const clean = slice.trim();
        if (!clean) return;

        out.push({
            text: clean,
            start: s,
            end: e,
            weight: computeSentenceUnits(slice),
        });
    };

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];

        // Paragraph / newline boundary
        if (ch === "\n") {
            // include newline in slice so it contributes to weight
            pushSpan(start, i + 1);
            start = i + 1;
            continue;
        }

        // End-stop boundary
        if (ch === "." || ch === "!" || ch === "?") {
            const next = text[i + 1] ?? "";
            const isEnd = i === text.length - 1;
            const nextIsSpace = next === " " || next === "\n" || next === "\t" || next === "\r";

            // avoid splitting inside decimals like 3.14 (simple heuristic)
            const prev = text[i - 1] ?? "";
            const next2 = text[i + 1] ?? "";
            const looksLikeDecimal = /\d/.test(prev) && next2 === "." ? false : (/\d/.test(prev) && /\d/.test(next2));

            if (!looksLikeDecimal && (isEnd || nextIsSpace)) {
                pushSpan(start, i + 1);
                start = i + 1;
            }
        }
    }

    if (start < text.length) {
        pushSpan(start, text.length);
    }

    // If our splitting is too aggressive with newlines, merge tiny spans.
    // This reduces "off by one" due to tiny fragments.
    return mergeTinySpans(out, 10);
}

function mergeTinySpans(spans: SentenceSpan[], minWords: number) {
    const merged: SentenceSpan[] = [];
    let buf: SentenceSpan | null = null;

    const wordCount = (t: string) => (t.match(/[A-Za-z0-9]+(?:'[A-Za-z0-9]+)?/g)?.length ?? 0);

    for (const s of spans) {
        if (!buf) {
            buf = { ...s };
            continue;
        }

        const wc = wordCount(buf.text);
        if (wc < minWords) {
            // merge current into buffer
            buf = {
                text: (buf.text + " " + s.text).replace(/\s+/g, " ").trim(),
                start: buf.start,
                end: s.end,
                weight: buf.weight + s.weight, // keeps timing consistent
            };
        } else {
            merged.push(buf);
            buf = { ...s };
        }
    }

    if (buf) merged.push(buf);
    return merged;
}

/**
 * Map current audio position to active sentence using cumulative "units".
 * This is the function your ReadAlongTwoLinePlayer already calls.
 */
export function activeSentenceIndexByProgressWeighted(
    sentences: SentenceSpan[],
    currentSeconds: number,
    durationSeconds: number
): number {
    if (!sentences?.length) return -1;
    if (!Number.isFinite(currentSeconds) || !Number.isFinite(durationSeconds) || durationSeconds <= 0) {
        return 0;
    }

    const totalUnits =
        sentences.reduce((sum, s) => sum + (Number.isFinite(s.weight) ? s.weight : 0), 0) || 1;

    // Convert time progress → unit progress
    const progress = clamp(currentSeconds / durationSeconds, 0, 1);
    const targetUnits = progress * totalUnits;

    // Find the sentence whose cumulative range contains targetUnits
    let acc = 0;
    for (let i = 0; i < sentences.length; i++) {
        const w = sentences[i].weight || 0;
        const next = acc + w;

        if (targetUnits <= next) {
            return i;
        }
        acc = next;
    }

    return sentences.length - 1;
}
