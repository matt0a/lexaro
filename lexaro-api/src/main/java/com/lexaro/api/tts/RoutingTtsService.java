package com.lexaro.api.tts;

import com.lexaro.api.domain.Plan;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RequiredArgsConstructor
public class RoutingTtsService implements TtsService {

    private final TtsService dev;       // nullable
    private final TtsService polly;
    private final TtsService speechify;
    private final String forceProvider; // "dev" | "polly" | "" (empty = route by plan)

    @Override
    public byte[] synthesize(Plan plan, String text, String voice, String engine, String format, String language) throws Exception {
        // Global override for debugging
        if ("dev".equalsIgnoreCase(forceProvider) && dev != null) {
            return dev.synthesize(plan, text, voice, engine, format, language);
        }
        if ("polly".equalsIgnoreCase(forceProvider)) {
            // respect requested engine
            return polly.synthesize(plan, text, voice, engine, format, language);
        }

        // Route by plan
        Plan p = (plan == null) ? Plan.FREE : plan;
        switch (p) {
            case FREE -> {
                // Force STANDARD on free
                String eng = "standard";
                return polly.synthesize(Plan.FREE, text, voice, eng, format, language);
            }
            case PREMIUM, BUSINESS, BUSINESS_PLUS -> {
                try {
                    return speechify.synthesize(p, text, voice, engine, format, language);
                } catch (RuntimeException ex) {
                    log.warn("Speechify failed for plan={}, falling back to Polly STANDARD. err={}", p, ex.toString());
                    return polly.synthesize(p, text, voice, "standard", format, language);
                }
            }
            default -> {
                return polly.synthesize(p, text, voice, "standard", format, language);
            }
        }
    }
}
