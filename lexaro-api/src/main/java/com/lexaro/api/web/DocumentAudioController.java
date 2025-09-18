package com.lexaro.api.web;

import com.lexaro.api.domain.AudioStatus;
import com.lexaro.api.repo.DocumentRepository;
import com.lexaro.api.service.DocumentAudioService;
import com.lexaro.api.service.DocumentService;
import com.lexaro.api.storage.StorageService;
import com.lexaro.api.web.dto.PresignDownloadResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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
    public String start(@PathVariable Long id, @RequestBody StartBody b) {
        audio.start(
                userId(),
                id,
                b.voice()  == null ? "Joanna" : b.voice(),
                b.engine() == null ? "neural" : b.engine(),
                b.format() == null ? "mp3" : b.format()
        );
        return "started";
    }

    @GetMapping
    public AudioStatusResponse status(@PathVariable Long id,
                                      @RequestParam(defaultValue = "300") int ttlSeconds) {
        var doc = docs.findByIdAndUserId(id, userId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));

        String url = null;
        if (doc.getAudioStatus() == AudioStatus.READY && doc.getAudioObjectKey() != null) {
            // Return a fully signed URL (with filename/type overrides inside the signature)
            var resp = docService.presignAudioDownload(userId(), id, ttlSeconds);
            url = resp.url();
        }
        return new AudioStatusResponse(doc.getAudioStatus().name(), doc.getAudioVoice(), doc.getAudioFormat(), url);
    }

    @GetMapping("/download")
    public PresignDownloadResponse presignAudio(@PathVariable Long id,
                                                @RequestParam(defaultValue = "300") int ttlSeconds) {
        return docService.presignAudioDownload(userId(), id, ttlSeconds);
    }
}
