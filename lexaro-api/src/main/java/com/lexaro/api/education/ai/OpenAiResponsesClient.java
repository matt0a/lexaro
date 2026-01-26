package com.lexaro.api.education.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lexaro.api.education.config.AiProviderProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.*;

@Component
@RequiredArgsConstructor
public class OpenAiResponsesClient implements AiClient {

    private final WebClient.Builder webClientBuilder;
    private final AiProviderProperties props;
    private final ObjectMapper objectMapper;

    @Override
    public AiResult generateText(String prompt, AiRequestOptions options) {
        return call(prompt, options, false);
    }

    @Override
    public AiResult generateJson(String prompt, AiRequestOptions options) {
        return call(prompt, options, true);
    }

    private AiResult call(String prompt, AiRequestOptions opt, boolean jsonMode) {
        AiProviderProperties.OpenAi p = props.getOpenai();

        WebClient wc = webClientBuilder
                .baseUrl(p.getBaseUrl())
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + p.getApiKey())
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", (opt != null && opt.getModelOverride() != null) ? opt.getModelOverride() : p.getModel());
        body.put("input", prompt);
        body.put("store", false);

        if (opt != null && opt.getTemperature() != null) body.put("temperature", opt.getTemperature());
        if (opt != null && opt.getMaxOutputTokens() != null) body.put("max_output_tokens", opt.getMaxOutputTokens());

        if (jsonMode) {
            Map<String, Object> textCfg = new HashMap<>();
            Map<String, Object> format = new HashMap<>();
            format.put("type", "json_object");
            textCfg.put("format", format);
            body.put("text", textCfg);
        }

        try {
            String raw = wc.post()
                    .uri("/v1/responses")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(p.getRequestTimeoutSeconds()))
                    .block();

            return parse(raw);

        } catch (WebClientResponseException e) {
            return AiResult.builder()
                    .text("")
                    .tokensIn(null)
                    .tokensOut(null)
                    .rawJson("HTTP " + e.getStatusCode() + ": " + e.getResponseBodyAsString())
                    .build();
        }
    }

    private AiResult parse(String rawJson) {
        try {
            JsonNode root = objectMapper.readTree(rawJson);

            String text = extractOutputText(root);

            Long inTok = null;
            Long outTok = null;

            JsonNode usage = root.get("usage");
            if (usage != null && usage.isObject()) {
                inTok = usage.has("input_tokens") ? usage.get("input_tokens").asLong() : null;
                outTok = usage.has("output_tokens") ? usage.get("output_tokens").asLong() : null;
            }

            return AiResult.builder()
                    .text(text == null ? "" : text.trim())
                    .tokensIn(inTok)
                    .tokensOut(outTok)
                    .rawJson(rawJson)
                    .build();
        } catch (Exception e) {
            return AiResult.builder()
                    .text("")
                    .tokensIn(null)
                    .tokensOut(null)
                    .rawJson(rawJson)
                    .build();
        }
    }

    private String extractOutputText(JsonNode root) {
        JsonNode output = root.get("output");
        if (output == null || !output.isArray()) return "";

        StringBuilder sb = new StringBuilder();
        for (JsonNode item : output) {
            if (!item.has("type")) continue;
            if (!"message".equals(item.get("type").asText())) continue;

            JsonNode content = item.get("content");
            if (content == null || !content.isArray()) continue;

            for (JsonNode c : content) {
                if (c.has("type") && "output_text".equals(c.get("type").asText()) && c.has("text")) {
                    sb.append(c.get("text").asText());
                }
            }
        }
        return sb.toString();
    }
}
