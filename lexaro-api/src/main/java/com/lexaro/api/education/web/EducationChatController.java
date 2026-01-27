package com.lexaro.api.education.web;

import com.lexaro.api.education.repo.dto.EducationChatRequest;
import com.lexaro.api.education.repo.dto.EducationChatResponse;
import com.lexaro.api.education.service.EducationChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/education")
@RequiredArgsConstructor
public class EducationChatController {

    private final EducationChatService chatService;

    private long userId() {
        return (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @PostMapping("/chat")
    public EducationChatResponse chat(@RequestBody EducationChatRequest request) {
        return chatService.chat(userId(), request);
    }
}
