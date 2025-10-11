package com.lexaro.api.tts;

import com.lexaro.api.domain.Plan;

public interface TtsService {
    /**
     * Synthesize the given text to audio bytes (small/medium text).
     * @param plan   user's/effective plan to route providers (FREE->Polly std, PREMIUM/PLUS->Speechify)
     * @param text   plain text (no SSML for MVP)
     * @param voice  e.g. "Joanna" (router/provider may map internally)
     * @param engine "standard" or "neural" (router may override to "standard" for FREE)
     * @param format "mp3" (MVP)
     * @param language optional BCP47 like "en-US" (provider may ignore)
     * @return audio bytes
     */
    byte[] synthesize(Plan plan, String text, String voice, String engine, String format, String language) throws Exception;
}
