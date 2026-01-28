package com.lexaro.api.education.web;

import com.lexaro.api.education.repo.dto.EssayGradeRequest;
import com.lexaro.api.education.repo.dto.EssayGradeResponse;
import com.lexaro.api.education.service.EssayGraderService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for essay grading operations.
 * Provides AI-powered essay evaluation with rubric-based feedback.
 */
@RestController
@RequestMapping("/education")
@RequiredArgsConstructor
public class EssayController {

    private final EssayGraderService essayGraderService;

    /**
     * Get the current user's ID from the security context.
     */
    private long userId() {
        return (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    /**
     * Grade an essay using AI-powered rubric evaluation.
     *
     * @param request the essay text and optional topic
     * @return detailed grading response with scores and feedback
     */
    @PostMapping("/essay/grade")
    public EssayGradeResponse gradeEssay(@RequestBody EssayGradeRequest request) {
        return essayGraderService.gradeEssay(userId(), request);
    }
}
