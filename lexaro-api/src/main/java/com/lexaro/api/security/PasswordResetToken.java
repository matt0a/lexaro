package com.lexaro.api.security;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "password_reset_tokens")
@Getter @Setter
public class PasswordResetToken {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name="user_id", nullable=false)
    Long userId;

    @Column(nullable=false, unique=true, length=128)
    String token;

    @Column(name="expires_at", nullable=false)
    Instant expiresAt;

    @Column(name="used_at")
    Instant usedAt;

    @Column(name="created_at", nullable=false)
    Instant createdAt = Instant.now();
}
