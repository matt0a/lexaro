package com.lexaro.api.web;

import com.lexaro.api.translate.TranslateService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/translate")
@RequiredArgsConstructor
@ConditionalOnBean(TranslateService.class)
public class TranslateController {

    private final TranslateService translate;

    @GetMapping("/languages")
    public List<TranslateService.Language> languages() {
        return translate.languages();
    }
}
