package com.lexaro.api.translate;

import java.util.List;

public interface TranslateService {
    /** Returns translated text. `source` may be "auto". */
    String translate(String text, String source, String target);

    /** Returns supported languages from provider (code + name). */
    List<Language> languages();

    record Language(String code, String name) {}
}
