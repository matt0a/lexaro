package com.lexaro.api.education.repo.dto;

import java.util.List;

public record EducationChatResponse(
        String answer,
        Long docId,
        List<EducationChatSourceDto> sources
) {}
