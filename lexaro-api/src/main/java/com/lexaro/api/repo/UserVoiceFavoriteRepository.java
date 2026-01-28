package com.lexaro.api.repo;

import com.lexaro.api.domain.UserVoiceFavorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface UserVoiceFavoriteRepository extends JpaRepository<UserVoiceFavorite, Long> {

    /**
     * Find all favorites for a user.
     */
    List<UserVoiceFavorite> findByUserId(Long userId);

    /**
     * Find a specific favorite.
     */
    Optional<UserVoiceFavorite> findByUserIdAndVoiceIdAndProvider(Long userId, String voiceId, String provider);

    /**
     * Check if a voice is favorited by a user.
     */
    boolean existsByUserIdAndVoiceIdAndProvider(Long userId, String voiceId, String provider);

    /**
     * Delete a favorite.
     */
    void deleteByUserIdAndVoiceIdAndProvider(Long userId, String voiceId, String provider);

    /**
     * Get all voice IDs favorited by a user (for efficient lookup).
     */
    @Query("SELECT CONCAT(f.voiceId, ':', f.provider) FROM UserVoiceFavorite f WHERE f.user.id = :userId")
    Set<String> findVoiceKeysByUserId(Long userId);

    /**
     * Count favorites for a user.
     */
    long countByUserId(Long userId);
}
