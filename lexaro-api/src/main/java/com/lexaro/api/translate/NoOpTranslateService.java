package com.lexaro.api.translate;

import java.util.List;

/** Disabled translation → pass-through behavior. */
public class NoOpTranslateService implements TranslateService {

    @Override
    public String translate(String text, String source, String target) {
        return text; // no translation performed
    }

    @Override
    public List<Language> languages() {
        return List.of(); // none while disabled
    }
}
