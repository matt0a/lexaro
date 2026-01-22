package com.lexaro.api.tts;

import com.lexaro.api.domain.Plan;

public interface TtsService {
    byte[] synthesize(Plan plan, String text, String voice, String engine, String format, String language) throws Exception;
}
