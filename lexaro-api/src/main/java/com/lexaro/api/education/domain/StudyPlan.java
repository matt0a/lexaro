package com.lexaro.api.education.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents an AI-generated study plan for a user.
 * Contains scheduled tasks leading up to an exam or goal date.
 */
@Entity
@Table(name = "education_study_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudyPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "exam_date")
    private LocalDate examDate;

    @Column(name = "weekly_hours")
    @Builder.Default
    private Integer weeklyHours = 10;

    @Column(name = "status", nullable = false)
    @Builder.Default
    private String status = "active";

    @OneToMany(mappedBy = "plan", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("scheduledDate ASC, id ASC")
    @Builder.Default
    private List<StudyTask> tasks = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /**
     * Add a task to this plan.
     */
    public void addTask(StudyTask task) {
        tasks.add(task);
        task.setPlan(this);
    }
}
