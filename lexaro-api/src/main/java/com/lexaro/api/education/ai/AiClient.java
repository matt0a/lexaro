package com.lexaro.api.education.ai;

public interface AiClient {

    AiResult generateText(String prompt, AiRequestOptions options);

    AiResult generateJson(String prompt, AiRequestOptions options);
}
