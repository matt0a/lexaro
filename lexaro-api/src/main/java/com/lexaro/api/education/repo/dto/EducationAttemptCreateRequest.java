package com.lexaro.api.education.repo.dto;

import lombok.Data;

import java.util.List;

@Data
public class EducationAttemptCreateRequest {
    private Long docId;          // nullable
    private String attemptType;  // e.g. "QUIZ", "FLASHCARDS"
    private String mode;         // e.g. "timed", "practice"
    private Integer score;       // nullable
    private Integer maxScore;    // nullable
    private Double percent;      // nullable (0-100)
    private List<String> weakTopics; // nullable
}
