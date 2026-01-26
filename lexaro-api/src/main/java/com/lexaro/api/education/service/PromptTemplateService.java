package com.lexaro.api.education.service;

public interface PromptTemplateService {
    String load(String name); // e.g. "chat", "quiz"
}
