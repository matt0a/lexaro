package com.lexaro.api.tts;

public interface TtsService {
    /**
     * Synthesize the given text to audio bytes (small/medium text).
     * @param text plain text (no SSML for MVP)
     * @param voice e.g. "Joanna"
     * @param engine "standard" or "neural"
     * @param format "mp3" (MVP)
     * @return audio bytes
     */
    byte[] synthesize(String text, String voice, String engine, String format) throws Exception;
}
