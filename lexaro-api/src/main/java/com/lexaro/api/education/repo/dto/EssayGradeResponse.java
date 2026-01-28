package com.lexaro.api.education.repo.dto;

import lombok.Builder;

import java.util.List;
import java.util.Map;

/**
 * Response containing essay grading results.
 */
@Builder
public record EssayGradeResponse(
        /** Overall score out of 100 */
        int overallScore,

        /** Individual rubric scores (thesis, organization, evidence, analysis, clarity, grammar) */
        Map<String, Integer> scores,

        /** List of strengths identified in the essay */
        List<String> strengths,

        /** List of areas for improvement */
        List<String> improvements,

        /** Detailed feedback paragraph */
        String detailedFeedback,

        /** Specific rewrite/revision suggestions */
        String rewriteSuggestion
) {}
