package com.lexaro.api.education.repo.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class EducationProgressSummaryDto {
    private int streakDays;
    private Instant lastStudyAt;
    private Double avgAccuracy;     // can be null if no attempts
    private int attemptsLast30;
}
