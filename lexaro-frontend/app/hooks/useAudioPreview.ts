// src/hooks/useAudioPreview.ts
import { useCallback, useEffect, useRef, useState } from 'react';

export function useAudioPreview() {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [playingId, setPlayingId] = useState<string | null>(null);

    const stop = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
            audioRef.current = null;
        }
        setPlayingId(null);
    }, []);

    const play = useCallback(async (id: string, url?: string | null) => {
        if (!url) return;         // no preview available
        // if clicking the same card, toggle stop
        if (playingId === id) {
            stop();
            return;
        }
        // stop any prior preview
        stop();

        const a = new Audio(url); // rely on provider’s CORS; Speechify works
        audioRef.current = a;
        setPlayingId(id);

        try {
            await a.play();
        } catch {
            // autoplay blocked; fall back to user gesture (the same handler is gesture-safe)
            // you can surface a toast here if you want
        }
    }, [playingId, stop]);

    // stop on unmount
    useEffect(() => stop, [stop]);

    return { play, stop, playingId, isPlaying: (id: string) => playingId === id };
}
