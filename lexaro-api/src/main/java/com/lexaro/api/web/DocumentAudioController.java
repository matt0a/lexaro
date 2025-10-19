package com.lexaro.api.web;

import com.lexaro.api.domain.AudioStatus;
import com.lexaro.api.domain.DocStatus;
import com.lexaro.api.repo.DocumentRepository;
import com.lexaro.api.service.DocumentAudioService;
import com.lexaro.api.service.DocumentService;
import com.lexaro.api.web.dto.AudioStartRequest;
import com.lexaro.api.web.dto.AudioStatusResponse;
import com.lexaro.api.web.dto.PresignDownloadResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/documents/{id}/audio")
@RequiredArgsConstructor
public class DocumentAudioController {

    private final DocumentRepository docs;
    private final DocumentService docService;
    private final DocumentAudioService audio;

    private Long userId() {
        return (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @PostMapping("/start")
    public String start(@PathVariable Long id, @RequestBody(required = false) AudioStartRequest req) {
        String normalizedVoice = req == null ? null : firstNonBlank(req.voice(), req.voice_id());
        String engine          = req == null ? null : blankToNull(req.engine());
        String format          = req == null ? null : blankToNull(req.format());

        // Translation is disabled → ALWAYS ignore targetLang (even if client sends it)
        String targetLangIgnored = null;

        audio.start(userId(), id, normalizedVoice, engine, format, targetLangIgnored);
        return "started";
    }

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

    private static String firstNonBlank(String a, String b) {
        if (a != null && !a.trim().isEmpty()) return a.trim();
        if (b != null && !b.trim().isEmpty()) return b.trim();
        return null;
    }

    private static String blankToNull(String s) {
        return (s == null || s.trim().isEmpty()) ? null : s.trim();
    }
}
