package com.lexaro.api.web;

import com.lexaro.api.domain.AudioStatus;
import com.lexaro.api.domain.DocStatus;
import com.lexaro.api.repo.DocumentRepository;
import com.lexaro.api.service.DocumentAudioService;
import com.lexaro.api.service.DocumentService;
import com.lexaro.api.service.IdempotencyService;
import com.lexaro.api.web.dto.AudioStartRequest;
import com.lexaro.api.web.dto.AudioStatusResponse;
import com.lexaro.api.web.dto.PresignDownloadResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

/**
 * REST controller for all audio-related operations on a document.
 *
 * <p>Endpoints:
 * <ul>
 *   <li>{@code POST /documents/{id}/audio/start} — start async audio generation</li>
 *   <li>{@code GET  /documents/{id}/audio}        — poll current audio status</li>
 *   <li>{@code GET  /documents/{id}/audio/download} — get presigned download URL</li>
 * </ul>
 *
 * <p>The start endpoint supports an optional {@code Idempotency-Key} header. When the
 * same key is presented within 24 hours, the endpoint replays the cached response without
 * re-dispatching the audio job. This allows clients to safely retry on network failures.
 */
@RestController
@RequestMapping("/documents/{id}/audio")
@RequiredArgsConstructor
public class DocumentAudioController {

    private final DocumentRepository docs;
    private final DocumentService docService;
    private final DocumentAudioService audio;
    private final IdempotencyService idempotencyService;

    /**
     * Extracts the authenticated user's ID from the Spring Security context.
     * The JWT filter stores a {@code Long} principal.
     *
     * @return the current user's ID
     */
    private Long userId() {
        return (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    /**
     * Starts asynchronous audio generation for the given document.
     *
     * <p>Returns {@code 202 Accepted} in all non-error cases:
     * <ul>
     *   <li>Job was newly dispatched</li>
     *   <li>Job was already PROCESSING (idempotent — no duplicate is created)</li>
     *   <li>Audio is already READY (idempotent — already done)</li>
     *   <li>An idempotency key was presented and a cached response was found</li>
     * </ul>
     *
     * <p>If an {@code Idempotency-Key} header is provided and a cached response exists,
     * the stored response is returned immediately without touching {@link DocumentAudioService}.
     * If no cache hit occurs, the normal start flow runs and the result is cached for 24 hours.
     *
     * @param id              the document ID (path variable)
     * @param idempotencyKey  optional {@code Idempotency-Key} header value from the client
     * @param req             optional request body carrying voice/engine/format preferences
     * @return 202 Accepted with body {@code "started"}
     */
    @PostMapping("/start")
    public ResponseEntity<String> start(
            @PathVariable Long id,
            @RequestHeader(name = "Idempotency-Key", required = false) String idempotencyKey,
            @RequestBody(required = false) AudioStartRequest req) {

        Long userId = userId();

        // Include the resolved docId in the endpoint key so that the same Idempotency-Key
        // value used for different documents doesn't collide in the idempotency table.
        final String ENDPOINT = "POST:/documents/" + id + "/audio/start";

        // 1. Ownership validation FIRST — before idempotency lookup — so an attacker cannot
        //    replay another user's cached response by presenting their Idempotency-Key
        //    against a document they don't own.
        var doc = docs.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));

        // 2. If the client sent an Idempotency-Key header, look up a cached response.
        //    Ownership has already been verified above, so replay is safe.
        if (idempotencyKey != null) {
            var existing = idempotencyService.find(userId, ENDPOINT, idempotencyKey);
            if (existing.isPresent()) {
                // Replay the cached response body verbatim (always "started" for this endpoint).
                return ResponseEntity.status(HttpStatus.ACCEPTED).body(existing.get().getResponse());
            }
        }

        if (doc.getAudioStatus() == AudioStatus.READY) {
            // Audio already done — idempotent 202 with no duplicate work.
            String responseBody = "started";
            if (idempotencyKey != null) {
                idempotencyService.store(userId, ENDPOINT, idempotencyKey, responseBody);
            }
            return ResponseEntity.status(HttpStatus.ACCEPTED).body(responseBody);
        }

        // 3. Normalize request fields (same logic as the original handler).
        String normalizedVoice = req == null ? null : firstNonBlank(req.voice(), req.voice_id());
        String engine          = req == null ? null : blankToNull(req.engine());
        String format          = req == null ? null : blankToNull(req.format());

        // Translation is disabled → ALWAYS ignore targetLang (even if client sends it).
        String targetLangIgnored = null;

        // 4. Delegate to DocumentAudioService which now uses an atomic DB claim internally
        //    to prevent duplicate job dispatch under concurrent requests.
        //    If the status is already PROCESSING, audio.start() returns silently (idempotent).
        audio.start(userId, id, normalizedVoice, engine, format, targetLangIgnored);

        // 5. Store the idempotency record so future retries with the same key get a fast replay.
        String responseBody = "started";
        if (idempotencyKey != null) {
            idempotencyService.store(userId, ENDPOINT, idempotencyKey, responseBody);
        }

        return ResponseEntity.status(HttpStatus.ACCEPTED).body(responseBody);
    }

    /**
     * Returns the current audio generation status for the given document.
     *
     * <p>When the document is in PROCESSING state, the response is {@code 202 Accepted}
     * with a {@code Retry-After: 3} header to hint the client polling interval.
     * All other states return {@code 200 OK}.
     *
     * @param id         the document ID (path variable)
     * @param ttlSeconds TTL for the presigned download URL when status is READY (default 300)
     * @return the current {@link AudioStatusResponse}
     */
    @GetMapping
    public ResponseEntity<AudioStatusResponse> status(@PathVariable Long id,
                                                      @RequestParam(defaultValue = "300") int ttlSeconds) {
        var doc = docs.findByIdAndUserId(id, userId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));

        if (doc.getStatus() == DocStatus.EXPIRED) {
            throw new ResponseStatusException(HttpStatus.GONE, "Document has expired.");
        }

        String url = null;
        if (doc.getAudioStatus() == AudioStatus.READY && doc.getAudioObjectKey() != null) {
            url = docService.presignAudioDownload(userId(), id, ttlSeconds).url();
        }

        var body = new AudioStatusResponse(
                doc.getAudioStatus().name(),
                doc.getAudioVoice(),
                doc.getAudioFormat(),
                url,
                doc.getAudioError()
        );

        if (doc.getAudioStatus() == AudioStatus.PROCESSING) {
            return ResponseEntity.status(HttpStatus.ACCEPTED)
                    .header("Retry-After", "3")
                    .body(body);
        }
        return ResponseEntity.ok(body);
    }

    /**
     * Returns a presigned download URL for the completed audio file.
     *
     * @param id         the document ID (path variable)
     * @param ttlSeconds TTL for the presigned URL in seconds (default 300, capped 60–3600)
     * @return presigned URL details
     */
    @GetMapping("/download")
    public PresignDownloadResponse presignAudio(@PathVariable Long id,
                                                @RequestParam(defaultValue = "300") int ttlSeconds) {
        var doc = docs.findByIdAndUserId(id, userId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));
        if (doc.getStatus() == DocStatus.EXPIRED) {
            throw new ResponseStatusException(HttpStatus.GONE, "Document has expired.");
        }
        return docService.presignAudioDownload(userId(), id, ttlSeconds);
    }

    /* -------- helpers -------- */

    /**
     * Returns the first non-blank string from the two arguments, or {@code null} if both are blank.
     * Used to normalise the {@code voice} and {@code voice_id} fields from the request body.
     */
    private static String firstNonBlank(String a, String b) {
        if (a != null && !a.trim().isEmpty()) return a.trim();
        if (b != null && !b.trim().isEmpty()) return b.trim();
        return null;
    }

    /**
     * Returns the trimmed string, or {@code null} if the input is null or blank.
     */
    private static String blankToNull(String s) {
        return (s == null || s.trim().isEmpty()) ? null : s.trim();
    }
}
