package com.lexaro.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import lombok.Data;

@Data
@Component
@ConfigurationProperties("lexaro.features")
public class FeaturesProperties {
    /**
     * If false, the backend will not translate text before TTS.
     * Requests that include translate params are ignored.
     */
    private boolean translate = false;
}
