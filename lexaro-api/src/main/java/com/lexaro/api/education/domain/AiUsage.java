package com.lexaro.api.education.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "ai_usage", schema = "public",
        indexes = {
                @Index(name = "idx_ai_usage_user_window", columnList = "user_id,window_start,window_end")
        }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AiUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="user_id", nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String plan;

    @Column(name="feature_key", nullable = false)
    private String featureKey;

    @Column(name="requests_count", nullable = false)
    private Long requestsCount;

    @Column(name="tokens_in", nullable = false)
    private Long tokensIn;

    @Column(name="tokens_out", nullable = false)
    private Long tokensOut;

    @Column(name="window_start", nullable = false)
    private Instant windowStart;

    @Column(name="window_end", nullable = false)
    private Instant windowEnd;

    @PrePersist
    void onCreate() {
        if (requestsCount == null) requestsCount = 0L;
        if (tokensIn == null) tokensIn = 0L;
        if (tokensOut == null) tokensOut = 0L;
    }
}
