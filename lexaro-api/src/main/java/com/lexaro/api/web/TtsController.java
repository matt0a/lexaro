package com.lexaro.api.web;

import com.lexaro.api.domain.User;
import com.lexaro.api.domain.UserVoiceFavorite;
import com.lexaro.api.repo.UserRepository;
import com.lexaro.api.repo.UserVoiceFavoriteRepository;
import com.lexaro.api.tts.TtsVoiceCatalogService;
import com.lexaro.api.web.dto.VoiceDto;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
public class TtsController {

    private final TtsVoiceCatalogService catalog;
    private final UserVoiceFavoriteRepository favoriteRepo;
    private final UserRepository userRepo;

    public TtsController(TtsVoiceCatalogService catalog,
                         UserVoiceFavoriteRepository favoriteRepo,
                         UserRepository userRepo) {
        this.catalog = catalog;
        this.favoriteRepo = favoriteRepo;
        this.userRepo = userRepo;
    }

    /**
     * List all voices available for the user's plan, with favorite status included.
     */
    @GetMapping("/tts/voices")
    public List<VoiceDto> listVoices(
            @AuthenticationPrincipal Long userId,
            @RequestParam(value = "plan", required = false) String plan
    ) {
        List<VoiceDto> voices = catalog.listUnifiedCatalog(plan);

        // If user is authenticated, mark favorites
        if (userId != null) {
            Set<String> favoriteKeys = favoriteRepo.findVoiceKeysByUserId(userId);
            voices = voices.stream()
                    .map(v -> {
                        String key = v.id() + ":" + v.provider();
                        return v.withFavorite(favoriteKeys.contains(key));
                    })
                    .toList();
        }

        return voices;
    }

    /**
     * Add a voice to user's favorites.
     */
    @PostMapping("/tts/voices/{voiceId}/favorite")
    @Transactional
    public ResponseEntity<?> addFavorite(
            @AuthenticationPrincipal Long userId,
            @PathVariable String voiceId,
            @RequestParam String provider
    ) {
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }

        // Check if already favorited
        if (favoriteRepo.existsByUserIdAndVoiceIdAndProvider(userId, voiceId, provider)) {
            return ResponseEntity.ok(Map.of("message", "Already favorited", "favorite", true));
        }

        User user = userRepo.findById(userId).orElseThrow();
        UserVoiceFavorite favorite = new UserVoiceFavorite(user, voiceId, provider);
        favoriteRepo.save(favorite);

        return ResponseEntity.ok(Map.of("message", "Added to favorites", "favorite", true));
    }

    /**
     * Remove a voice from user's favorites.
     */
    @DeleteMapping("/tts/voices/{voiceId}/favorite")
    @Transactional
    public ResponseEntity<?> removeFavorite(
            @AuthenticationPrincipal Long userId,
            @PathVariable String voiceId,
            @RequestParam String provider
    ) {
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }

        favoriteRepo.deleteByUserIdAndVoiceIdAndProvider(userId, voiceId, provider);
        return ResponseEntity.ok(Map.of("message", "Removed from favorites", "favorite", false));
    }

    /**
     * Get user's favorite voices with full metadata.
     */
    @GetMapping("/tts/voices/favorites")
    public List<VoiceDto> listFavorites(
            @AuthenticationPrincipal Long userId,
            @RequestParam(value = "plan", required = false) String plan
    ) {
        if (userId == null) {
            return List.of();
        }

        Set<String> favoriteKeys = favoriteRepo.findVoiceKeysByUserId(userId);
        if (favoriteKeys.isEmpty()) {
            return List.of();
        }

        // Get all voices and filter to favorites only
        List<VoiceDto> allVoices = catalog.listUnifiedCatalog(plan);
        return allVoices.stream()
                .filter(v -> favoriteKeys.contains(v.id() + ":" + v.provider()))
                .map(v -> v.withFavorite(true))
                .toList();
    }
}
