package com.lexaro.api.education.repo.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EducationWeakTopicDto {
    private String topic;
    private long count;
}
