package com.lexaro.api.education.ai;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AiRequestOptions {
    private String modelOverride;
    private Double temperature;
    private Integer maxOutputTokens;
}
