package com.lexaro.api.education.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "education_user_stats", schema = "public")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class EducationUserStats {

    @Id
    @Column(name="user_id")
    private Long userId;

    @Column(name="streak_days", nullable = false)
    private Integer streakDays;

    @Column(name="last_study_at")
    private Instant lastStudyAt;

    @Column(name="avg_accuracy")
    private Double avgAccuracy;

    @Column(name="attempts_last_30", nullable = false)
    private Integer attemptsLast30;

    @Column(name="updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        if (streakDays == null) streakDays = 0;
        if (attemptsLast30 == null) attemptsLast30 = 0;
        if (updatedAt == null) updatedAt = Instant.now();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
