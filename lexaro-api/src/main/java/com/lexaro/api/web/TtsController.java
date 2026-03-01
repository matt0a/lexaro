package com.lexaro.api.web;

import com.lexaro.api.domain.User;
import com.lexaro.api.domain.UserVoiceFavorite;
import com.lexaro.api.repo.UserRepository;
import com.lexaro.api.repo.UserVoiceFavoriteRepository;
import com.lexaro.api.tts.TtsVoiceCatalogService;
import com.lexaro.api.web.dto.VoiceDto;
import com.lexaro.api.web.support.ETagHelper;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.WebRequest;

import java.time.Duration;
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
     *
     * <p>Supports conditional GET via ETag / If-None-Match (RFC 7232).
     * The ETag is computed from the voice catalog content (id + provider pairs, sorted)
     * using SHA-256 so it is stable across JVM restarts. Favorites are user-specific, so
     * Cache-Control is set to {@code private} — the ETag check still applies per client.
     *
     * <p>If the client sends an {@code If-None-Match} header matching the current ETag,
     * Spring's {@link WebRequest#checkNotModified(String)} returns {@code true} and we
     * respond with HTTP 304 Not Modified (no body), saving bandwidth and parsing overhead
     * for unchanged catalog data.
     *
     * @param userId     the authenticated user's ID (null if unauthenticated)
     * @param plan       optional plan tier filter (e.g. "FREE", "PREMIUM")
     * @param webRequest injected by Spring MVC; used for If-None-Match comparison
     * @return 200 with voice list and ETag header, or 304 Not Modified
     */
    @GetMapping("/tts/voices")
    public ResponseEntity<?> listVoices(
            @AuthenticationPrincipal Long userId,
            @RequestParam(value = "plan", required = false) String plan,
            WebRequest webRequest
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

        // Generate a stable ETag from the catalog content (id + provider, sorted).
        // VoiceDto is a Java record so its component accessors have no "get" prefix.
        String etag = ETagHelper.fromVoices(voices, VoiceDto::id, VoiceDto::provider);

        // If the client already has the current version, return 304 with no body.
        // Spring sets the ETag response header automatically when checkNotModified returns true.
        if (webRequest.checkNotModified(etag)) {
            return ResponseEntity.status(HttpStatus.NOT_MODIFIED).build();
        }

        // Return the full catalog with ETag and Cache-Control headers.
        // Cache-Control: private because the favorite flags are user-specific.
        // max-age=8h with must-revalidate: clients may use the cached response for
        // up to 8 hours, but must revalidate with the server (using ETag) before serving stale.
        return ResponseEntity.ok()
                .eTag(etag)
                .cacheControl(CacheControl.maxAge(Duration.ofHours(8))
                        .cachePrivate()
                        .mustRevalidate())
                .body(voices);
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
