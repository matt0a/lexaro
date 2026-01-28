package com.lexaro.api.education.service;

import com.lexaro.api.education.repo.dto.CreateStudyPlanRequest;
import com.lexaro.api.education.repo.dto.StudyPlanDto;
import com.lexaro.api.education.repo.dto.StudyTaskDto;

import java.util.List;

/**
 * Service for study plan generation and management.
 */
public interface StudyPlanService {

    /**
     * Create a new AI-generated study plan.
     *
     * @param userId  the user creating the plan
     * @param request plan parameters
     * @return the generated study plan with tasks
     */
    StudyPlanDto createPlan(long userId, CreateStudyPlanRequest request);

    /**
     * Get all study plans for a user.
     *
     * @param userId the user ID
     * @return list of study plans
     */
    List<StudyPlanDto> getPlans(long userId);

    /**
     * Get a specific study plan.
     *
     * @param userId the user ID (ownership check)
     * @param planId the plan ID
     * @return the study plan
     */
    StudyPlanDto getPlan(long userId, long planId);

    /**
     * Mark a task as completed.
     *
     * @param userId the user ID
     * @param taskId the task ID
     * @return the updated task
     */
    StudyTaskDto completeTask(long userId, long taskId);

    /**
     * Skip a task.
     *
     * @param userId the user ID
     * @param taskId the task ID
     * @return the updated task
     */
    StudyTaskDto skipTask(long userId, long taskId);

    /**
     * Delete a study plan.
     *
     * @param userId the user ID
     * @param planId the plan ID
     */
    void deletePlan(long userId, long planId);
}
