package com.lexaro.api.tts;

import com.lexaro.api.domain.Plan;

public class DevTtsService implements TtsService {
    @Override
    public byte[] synthesize(Plan plan, String text, String voice, String engine, String format, String language) {
        return ("DEV_TTS:" + text).getBytes();
    }
}
