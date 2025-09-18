package com.lexaro.api.tts;

public class DevTtsService implements TtsService {
    @Override
    public byte[] synthesize(String text, String voice, String engine, String format) {
        // tiny fake MP3/PCM bytes for local dev; replace with something simple
        return ("DEV_TTS:" + text).getBytes();
    }
}
