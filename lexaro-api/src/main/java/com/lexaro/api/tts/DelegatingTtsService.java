package com.lexaro.api.tts;

import com.lexaro.api.domain.Plan;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.Locale;

@RequiredArgsConstructor
@Slf4j
public class DelegatingTtsService implements TtsService {

    private final TtsService polly;
    private final TtsService speechify;

    @Override
    public byte[] synthesize(Plan plan,
                             String text,
                             String voice,
                             String engine,
                             String format,
                             String language) throws Exception {

        String e = (engine == null) ? "" : engine.trim().toLowerCase(Locale.ROOT);

        if ("neural".equals(e)) {
            log.info("TTS ROUTE → SPEECHIFY  plan={} voice={} fmt={} lang={}", plan, voice, format, language);
            return speechify.synthesize(plan, text, voice, engine, format, language);
        }

        log.info("TTS ROUTE → POLLY       plan={} voice={} fmt={} lang={}", plan, voice, format, language);
        return polly.synthesize(plan, text, voice, engine, format, language);
    }
}
