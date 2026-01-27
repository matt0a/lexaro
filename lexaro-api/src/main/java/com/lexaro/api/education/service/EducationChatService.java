package com.lexaro.api.education.service;

import com.lexaro.api.education.repo.dto.EducationChatRequest;
import com.lexaro.api.education.repo.dto.EducationChatResponse;

public interface EducationChatService {
    EducationChatResponse chat(long userId, EducationChatRequest request);
}
