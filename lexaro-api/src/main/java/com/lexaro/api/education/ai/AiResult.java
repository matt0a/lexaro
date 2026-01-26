package com.lexaro.api.education.ai;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AiResult {
    private String text;
    private Long tokensIn;
    private Long tokensOut;
    private String rawJson;
}
