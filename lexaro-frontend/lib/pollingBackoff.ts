/**
 * Utility for computing exponential backoff intervals with jitter.
 *
 * Used by polling hooks (e.g. useAudioStatus) to avoid thundering-herd
 * patterns when many clients poll the same endpoint simultaneously.
 */

/**
 * Computes exponential backoff delay with jitter for polling.
 *
 * The base delay doubles on each attempt up to `max`, then a random jitter
 * of ±(`jitterFactor` × base) is added to spread out concurrent requests.
 *
 * Example sequence with defaults (min=1000, max=15000, jitterFactor=0.1):
 *   attempt 0 → ~1 000 ms
 *   attempt 1 → ~2 000 ms
 *   attempt 2 → ~4 000 ms
 *   attempt 3 → ~8 000 ms
 *   attempt 4+ → ~15 000 ms (capped)
 *
 * @param attemptCount  - Number of completed fetch attempts (0 = first retry interval)
 * @param min           - Minimum interval in ms (default 1 000)
 * @param max           - Maximum interval cap in ms (default 15 000)
 * @param jitterFactor  - Fraction of base to use as ±jitter range (default 0.1 = ±10%)
 * @returns Milliseconds to wait before the next poll
 */
export function getBackoffInterval(
    attemptCount: number,
    min = 1000,
    max = 15000,
    jitterFactor = 0.1,
): number {
    // Exponential base, capped at max
    const base = Math.min(min * Math.pow(2, attemptCount), max);
    // Jitter range: ±(base × jitterFactor)
    const jitter = base * jitterFactor;
    // Random value in [-jitter, +jitter]
    return base + (Math.random() * 2 - 1) * jitter;
}
