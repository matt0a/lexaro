package com.lexaro.api.web.dto;

public record SpeechifyRequest(String input, String voice_id, String audio_format) {}
