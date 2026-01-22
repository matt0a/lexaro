// lib/tts.ts
import api from "@/lib/api";

type PresignDownloadResponse = { url: string; ttlSeconds: number };

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

/**
 * Wait until /documents/:id/audio/download succeeds (audio exists + presign works).
 * This avoids needing a separate "status" endpoint.
 */
export async function waitForAudioReady(
    documentId: number,
    opts?: {
        ttlSeconds?: number;
        timeoutMs?: number;
        intervalMs?: number;
    }
): Promise<PresignDownloadResponse> {
    const ttlSeconds = opts?.ttlSeconds ?? 300;
    const timeoutMs = opts?.timeoutMs ?? 120_000; // 2 min
    const intervalMs = opts?.intervalMs ?? 1200;

    const started = Date.now();

    while (Date.now() - started < timeoutMs) {
        try {
            const { data } = await api.get<PresignDownloadResponse>(
                `/documents/${documentId}/audio/download`,
                { params: { ttlSeconds } }
            );
            return data;
        } catch (e: any) {
            // Common "not ready yet" statuses (depends on your backend)
            const s = e?.response?.status;

            // Treat these as "still generating"
            if (s === 404 || s === 409 || s === 425 || s === 503) {
                await sleep(intervalMs);
                continue;
            }

            // Anything else: real error
            throw e;
        }
    }

    throw new Error("Audio is taking longer than expected. Try again in a moment.");
}
