package com.lexaro.api.education.service.impl;

import com.lexaro.api.education.service.PromptTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class PromptTemplateServiceImpl implements PromptTemplateService {

    private final Map<String, String> cache = new ConcurrentHashMap<>();

    @Override
    public String load(String name) {
        return cache.computeIfAbsent(name, this::readPrompt);
    }

    private String readPrompt(String name) {
        try {
            ClassPathResource r = new ClassPathResource("prompts/" + name + ".txt");
            byte[] bytes = r.getInputStream().readAllBytes();
            return new String(bytes, StandardCharsets.UTF_8).trim();
        } catch (Exception e) {
            throw new IllegalStateException("Missing prompt: prompts/" + name + ".txt", e);
        }
    }
}
