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
public class DeepSeekChatClient implements AiClient {

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
        AiProviderProperties.DeepSeek p = props.getDeepseek();

        WebClient wc = webClientBuilder
                .baseUrl(p.getBaseUrl())
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + p.getApiKey())
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", (opt != null && opt.getModelOverride() != null) ? opt.getModelOverride() : p.getModel());
        body.put("stream", false);

        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", jsonMode
                ? "You are a helpful assistant. Output ONLY valid JSON."
                : "You are a helpful assistant."));
        messages.add(Map.of("role", "user", "content", prompt));
        body.put("messages", messages);

        if (opt != null && opt.getTemperature() != null) body.put("temperature", opt.getTemperature());
        if (opt != null && opt.getMaxOutputTokens() != null) body.put("max_tokens", opt.getMaxOutputTokens());

        if (jsonMode) {
            body.put("response_format", Map.of("type", "json_object"));
        }

        String uri = deepSeekChatCompletionsPath(p.getBaseUrl());

        try {
            String raw = wc.post()
                    .uri(uri)
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

    private String deepSeekChatCompletionsPath(String baseUrl) {
        String b = (baseUrl == null) ? "" : baseUrl.trim().toLowerCase(Locale.ROOT);
        // If baseUrl already ends with /v1, don't add it twice.
        return b.endsWith("/v1") ? "/chat/completions" : "/v1/chat/completions";
    }

    private AiResult parse(String rawJson) {
        try {
            JsonNode root = objectMapper.readTree(rawJson);

            String text = "";
            JsonNode choices = root.get("choices");
            if (choices != null && choices.isArray() && choices.size() > 0) {
                JsonNode msg = choices.get(0).get("message");
                if (msg != null && msg.has("content")) text = msg.get("content").asText();
            }

            Long inTok = null, outTok = null;
            JsonNode usage = root.get("usage");
            if (usage != null && usage.isObject()) {
                if (usage.has("prompt_tokens")) inTok = usage.get("prompt_tokens").asLong();
                if (usage.has("completion_tokens")) outTok = usage.get("completion_tokens").asLong();
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
}
