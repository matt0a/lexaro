package com.lexaro.api.web;

import com.lexaro.api.domain.AudioStatus;
import com.lexaro.api.repo.DocumentRepository;
import com.lexaro.api.service.DocumentAudioService;
import com.lexaro.api.service.DocumentService;
import com.lexaro.api.storage.StorageService;
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
    private final StorageService storage;

    private Long userId() {
        return (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    public record StartBody(String voice, String engine, String format) {}
    public record AudioStatusResponse(String status, String voice, String format, String downloadUrl) {}

    @PostMapping("/start")
    public String start(@PathVariable Long id, @RequestBody(required = false) StartBody b) {
        String voice  = (b == null || b.voice()  == null || b.voice().isBlank())  ? "Joanna"  : b.voice();
        String engine = (b == null || b.engine() == null || b.engine().isBlank()) ? "standard": b.engine(); // default standard
        String format = (b == null || b.format() == null || b.format().isBlank()) ? "mp3"     : b.format();

        audio.start(userId(), id, voice, engine, format);
        return "started";
    }

    @GetMapping
    public ResponseEntity<AudioStatusResponse> status(@PathVariable Long id,
                                                      @RequestParam(defaultValue = "300") int ttlSeconds) {
        var doc = docs.findByIdAndUserId(id, userId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));

        String url = null;
        if (doc.getAudioStatus() == AudioStatus.READY && doc.getAudioObjectKey() != null) {
            url = docService.presignAudioDownload(userId(), id, ttlSeconds).url();
        }

        var body = new AudioStatusResponse(
                doc.getAudioStatus().name(),
                doc.getAudioVoice(),
                doc.getAudioFormat(),
                url
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
        return docService.presignAudioDownload(userId(), id, ttlSeconds);
    }
}
