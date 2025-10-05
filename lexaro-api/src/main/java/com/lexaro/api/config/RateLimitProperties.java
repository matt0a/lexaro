package com.lexaro.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.ratelimit")
public class RateLimitProperties {
    public Section auth = new Section();
    public Section ttsStart = new Section();

    public static class Section {
        public boolean enabled = true;
        public long capacity = 5;
        public long refillTokens = 5;
        public long refillSeconds = 10;
    }
}
