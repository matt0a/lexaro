// put this next to VoicePickModal.tsx (as in your screenshot)
let regionNames: Intl.DisplayNames | null = null;

/** Convert ISO region like "AE" → "United Arab Emirates". */
export function prettyRegion(code?: string | null): string | undefined {
    if (!code) return undefined;
    try {
        if (!regionNames) {
            regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
        }
        const fixed = code.toUpperCase() === 'UK' ? 'GB' : code.toUpperCase();
        return regionNames.of(fixed) || fixed;
    } catch {
        return code || undefined;
    }
}
