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
    private final String forceProvider; // "dev" | "polly" | "" (route by plan)

    @Override
    public byte[] synthesize(Plan plan, String text, String voice, String engine, String format, String language) throws Exception {
        if ("dev".equalsIgnoreCase(forceProvider) && dev != null) {
            return dev.synthesize(plan, text, voice, engine, format, language);
        }
        if ("polly".equalsIgnoreCase(forceProvider)) {
            return polly.synthesize(plan, text, voice, engine, format, language);
        }

        Plan p = (plan == null) ? Plan.FREE : plan;

        return switch (p) {
            case FREE -> polly.synthesize(Plan.FREE, text, voice, "standard", format, language);

            case PREMIUM, BUSINESS, BUSINESS_PLUS -> {
                try {
                    yield speechify.synthesize(p, text, voice, engine, format, language);
                } catch (RuntimeException ex) {
                    log.warn("Speechify failed for plan={}, falling back to Polly STANDARD. err={}", p, ex.toString());
                    yield polly.synthesize(p, text, voice, "standard", format, language);
                }
            }

            default -> polly.synthesize(p, text, voice, "standard", format, language);
        };
    }
}
