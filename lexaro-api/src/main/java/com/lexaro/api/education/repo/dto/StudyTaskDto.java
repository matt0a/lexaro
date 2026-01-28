package com.lexaro.api.education.repo.dto;

import lombok.Builder;

import java.time.Instant;
import java.time.LocalDate;

/**
 * DTO representing a study task.
 */
@Builder
public record StudyTaskDto(
        Long id,
        Long docId,
        String taskType,
        String title,
        String description,
        LocalDate scheduledDate,
        Integer durationMins,
        String status,
        Instant completedAt
) {}
