package com.lexaro.api.education.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "app.ai")
public class AiProviderProperties {

    /**
     * "openai" | "deepseek"
     */
    private String provider = "deepseek";

    private OpenAi openai = new OpenAi();
    private DeepSeek deepseek = new DeepSeek();

    @Data
    public static class OpenAi {
        private String baseUrl = "https://api.openai.com";
        private String apiKey;
        private String model = "gpt-4o-mini";
        private int requestTimeoutSeconds = 60;
    }

    @Data
    public static class DeepSeek {
        private String baseUrl = "https://api.deepseek.com";
        private String apiKey;
        private String model = "deepseek-chat";
        private int requestTimeoutSeconds = 60;
    }
}
