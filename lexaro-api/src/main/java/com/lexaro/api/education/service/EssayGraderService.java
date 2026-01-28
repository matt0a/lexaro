package com.lexaro.api.education.service;

import com.lexaro.api.education.repo.dto.EssayGradeRequest;
import com.lexaro.api.education.repo.dto.EssayGradeResponse;

/**
 * Service for AI-powered essay grading.
 */
public interface EssayGraderService {

    /**
     * Grade an essay using AI-powered rubric evaluation.
     *
     * @param userId  the user requesting the grade
     * @param request the essay and optional topic
     * @return detailed grading response with scores and feedback
     */
    EssayGradeResponse gradeEssay(long userId, EssayGradeRequest request);
}
