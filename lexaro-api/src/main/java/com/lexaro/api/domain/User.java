package com.lexaro.api.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name="users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false, unique=true)
    private String email;

    @Column(name="password_hash", nullable=false)
    private String passwordHash;

    @Enumerated(EnumType.STRING) @Column(nullable=false)
    private Plan plan;

    @Column(name="retention_days", nullable=false)
    private int retentionDays;

    @Column(name="created_at", nullable=false)
    private Instant createdAt;

    @Column(nullable = false) private boolean verified = false;
    private String verificationToken;
    private Instant verificationSentAt;
    private Instant verifiedAt;
}
