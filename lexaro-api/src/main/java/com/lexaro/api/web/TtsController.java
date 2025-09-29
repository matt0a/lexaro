package com.lexaro.api.web;

import com.lexaro.api.tts.TtsVoiceCatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/tts")
@RequiredArgsConstructor
public class TtsController {

    private final TtsVoiceCatalogService catalog;

    public record VoiceDto(String name, String gender, String language, Set<String> enginesSupported) {}

    @GetMapping("/voices")
    public List<VoiceDto> listVoices() {
        return catalog.listVoices().stream()
                .map(v -> new VoiceDto(v.name(), v.gender(), v.language(), v.enginesSupported()))
                .toList();
    }
}
