package com.lexaro.api.web;

import com.lexaro.api.tts.TtsVoiceCatalogService;
import com.lexaro.api.web.dto.VoiceDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class TtsController {

    private final TtsVoiceCatalogService catalog;

    public TtsController(TtsVoiceCatalogService catalog) {
        this.catalog = catalog;
    }

    @GetMapping("/tts/voices")
    public List<VoiceDto> listVoices(@RequestParam(value = "plan", required = false) String plan) {
        return catalog.listUnifiedCatalog(plan);
    }
}
