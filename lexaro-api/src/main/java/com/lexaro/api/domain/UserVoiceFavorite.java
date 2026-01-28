package com.lexaro.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * Stores user's favorite voices for quick access in the voice picker.
 */
@Entity
@Table(name = "user_voice_favorites",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "voice_id", "provider"}))
@Getter
@Setter
@NoArgsConstructor
public class UserVoiceFavorite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "voice_id", nullable = false)
    private String voiceId;

    @Column(name = "provider", nullable = false, length = 20)
    private String provider;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public UserVoiceFavorite(User user, String voiceId, String provider) {
        this.user = user;
        this.voiceId = voiceId;
        this.provider = provider;
        this.createdAt = Instant.now();
    }
}
