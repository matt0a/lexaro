package com.lexaro.api.education.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/**
 * Represents a single question within a quiz.
 * Supports multiple choice questions (MCQ) with choices stored as JSON.
 */
@Entity
@Table(name = "education_quiz_questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    @Column(name = "question_index", nullable = false)
    private int questionIndex;

    @Column(name = "question_type", nullable = false)
    @Builder.Default
    private String questionType = "mcq";

    @Column(name = "prompt", nullable = false, columnDefinition = "TEXT")
    private String prompt;

    @Column(name = "choices", columnDefinition = "TEXT")
    private String choices;  // JSON array: ["A", "B", "C", "D"]

    @Column(name = "answer_index")
    private Integer answerIndex;

    @Column(name = "explanation", columnDefinition = "TEXT")
    private String explanation;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
