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

    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false, unique=true)
    private String email;

    @Column(name="password_hash", nullable=false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable=false)
    private Plan plan;

    @Column(name="retention_days", nullable=false)
    private int retentionDays;

    @Column(name="created_at", nullable=false)
    private Instant createdAt;

    @Column(nullable = false)
    private boolean verified = false;

    private String verificationToken;
    private Instant verificationSentAt;
    private Instant verifiedAt;

    // ✅ Trial enforcement (server-side)
    private Instant trialUsedAt;

    @Column(name = "trial_cooldown_until")
    private Instant trialCooldownUntil;

    // Stripe
    @Column(name = "stripe_customer_id")
    private String stripeCustomerId;

    @Column(name = "stripe_subscription_id")
    private String stripeSubscriptionId;

    @Column(name = "stripe_subscription_status")
    private String stripeSubscriptionStatus; // trialing, active, canceled, past_due, etc.

    // Education onboarding
    @Column(name = "onboarding_completed", nullable = false)
    @Builder.Default
    private boolean onboardingCompleted = false;
}
