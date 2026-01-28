package com.lexaro.api.education.web;

import com.lexaro.api.education.repo.dto.CreateStudyPlanRequest;
import com.lexaro.api.education.repo.dto.StudyPlanDto;
import com.lexaro.api.education.repo.dto.StudyTaskDto;
import com.lexaro.api.education.service.StudyPlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for study plan operations.
 * Handles plan creation, task management, and progress tracking.
 */
@RestController
@RequestMapping("/education")
@RequiredArgsConstructor
public class StudyPlanController {

    private final StudyPlanService studyPlanService;

    /**
     * Get the current user's ID from the security context.
     */
    private long userId() {
        return (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    /**
     * Create a new study plan.
     */
    @PostMapping("/plans")
    public StudyPlanDto createPlan(@RequestBody CreateStudyPlanRequest request) {
        return studyPlanService.createPlan(userId(), request);
    }

    /**
     * Get all study plans for the current user.
     */
    @GetMapping("/plans")
    public List<StudyPlanDto> getPlans() {
        return studyPlanService.getPlans(userId());
    }

    /**
     * Get a specific study plan.
     */
    @GetMapping("/plans/{planId}")
    public StudyPlanDto getPlan(@PathVariable Long planId) {
        return studyPlanService.getPlan(userId(), planId);
    }

    /**
     * Delete a study plan.
     */
    @DeleteMapping("/plans/{planId}")
    public void deletePlan(@PathVariable Long planId) {
        studyPlanService.deletePlan(userId(), planId);
    }

    /**
     * Mark a task as completed.
     */
    @PostMapping("/tasks/{taskId}/complete")
    public StudyTaskDto completeTask(@PathVariable Long taskId) {
        return studyPlanService.completeTask(userId(), taskId);
    }

    /**
     * Skip a task.
     */
    @PostMapping("/tasks/{taskId}/skip")
    public StudyTaskDto skipTask(@PathVariable Long taskId) {
        return studyPlanService.skipTask(userId(), taskId);
    }
}
