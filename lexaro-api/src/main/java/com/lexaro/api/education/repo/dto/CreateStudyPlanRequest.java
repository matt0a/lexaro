package com.lexaro.api.education.repo.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * Request for creating a study plan.
 *
 * @param title       plan title (e.g., "Final Exam Prep")
 * @param description optional description
 * @param examDate    target exam/goal date
 * @param weeklyHours hours per week available for study (default: 10)
 * @param docIds      document IDs to include in the plan
 * @param focusTopics optional topics to focus on (e.g., weak areas)
 */
public record CreateStudyPlanRequest(
        String title,
        String description,
        LocalDate examDate,
        Integer weeklyHours,
        List<Long> docIds,
        List<String> focusTopics
) {
    public int weeklyHoursOrDefault() {
        return weeklyHours != null ? Math.max(1, Math.min(40, weeklyHours)) : 10;
    }
}
