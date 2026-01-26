package com.lexaro.api.education.repo.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
@Builder
public class EducationAttemptEventDto {
    private Long id;
    private Long docId;
    private String attemptType;
    private String mode;
    private Integer score;
    private Integer maxScore;
    private Double percent;
    private List<String> weakTopics;
    private Instant createdAt;
}
