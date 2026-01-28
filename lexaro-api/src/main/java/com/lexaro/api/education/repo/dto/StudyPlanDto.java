package com.lexaro.api.education.repo.dto;

import lombok.Builder;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * DTO representing a study plan with its tasks.
 */
@Builder
public record StudyPlanDto(
        Long id,
        String title,
        String description,
        LocalDate examDate,
        Integer weeklyHours,
        String status,
        List<StudyTaskDto> tasks,
        int totalTasks,
        int completedTasks,
        Instant createdAt
) {}
