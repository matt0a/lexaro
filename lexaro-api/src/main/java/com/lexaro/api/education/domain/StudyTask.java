package com.lexaro.api.education.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Represents a single task within a study plan.
 * Tasks can be reading, quizzes, flashcards, review sessions, etc.
 */
@Entity
@Table(name = "education_study_tasks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudyTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private StudyPlan plan;

    @Column(name = "doc_id")
    private Long docId;

    /**
     * Type of task: reading, quiz, flashcards, review, notes, essay
     */
    @Column(name = "task_type", nullable = false)
    private String taskType;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "scheduled_date", nullable = false)
    private LocalDate scheduledDate;

    @Column(name = "duration_mins")
    @Builder.Default
    private Integer durationMins = 30;

    /**
     * Status: pending, completed, skipped
     */
    @Column(name = "status", nullable = false)
    @Builder.Default
    private String status = "pending";

    @Column(name = "completed_at")
    private Instant completedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
