package com.lexaro.api.education.ai;

import com.lexaro.api.education.config.AiProviderProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AiClientRouter {

    private final AiProviderProperties props;
    private final OpenAiResponsesClient openAi;
    private final DeepSeekChatClient deepSeek;

    public AiClient current() {
        String p = (props.getProvider() == null) ? "" : props.getProvider().trim().toLowerCase();
        return p.equals("openai") ? openAi : deepSeek;
    }
}
