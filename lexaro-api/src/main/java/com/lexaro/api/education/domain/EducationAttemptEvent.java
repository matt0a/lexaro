package com.lexaro.api.education.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Entity
@Table(name = "education_attempt_event", schema = "public",
        indexes = {
                @Index(name = "idx_education_attempt_event_user_created", columnList = "user_id,created_at"),
                @Index(name = "idx_education_attempt_event_user_mode", columnList = "user_id,mode")
        }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class EducationAttemptEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="user_id", nullable = false)
    private Long userId;

    @Column(name="doc_id")
    private Long docId;

    @Enumerated(EnumType.STRING)
    @Column(name="attempt_type", nullable = false)
    private AttemptType attemptType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AttemptMode mode;

    @Column
    private Integer score;

    @Column(name="max_score")
    private Integer maxScore;

    @Column
    private Double percent;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name="weak_topics", columnDefinition = "text[]")
    private String[] weakTopics;

    @Column(name="created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
    }
}
