package com.lexaro.api.education.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "education_workspace", schema = "public")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class EducationWorkspace {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="user_id", nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String name;

    @Column(name="created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
    }
}
