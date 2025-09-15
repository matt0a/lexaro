package com.lexaro.api.web;

import com.lexaro.api.service.DocumentService;
import com.lexaro.api.web.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/documents")
@RequiredArgsConstructor
public class DocumentController {
    private final DocumentService docs;

    @Value("${app.upload.presignTtlSeconds:900}")
    private int presignTtlSeconds;


    private Long userId() {
        return (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    // FREE path: create a library entry without uploading any file to the server
    @PostMapping("/metadata")
    public DocumentResponse create(@RequestBody CreateMetadataRequest r) {
        return docs.createMetadata(userId(), r);
    }

    @GetMapping
    public Page<DocumentResponse> list(@RequestParam(defaultValue="0") int page,
                                       @RequestParam(defaultValue="20") int size) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "uploadedAt"));
        return docs.list(userId(), pageable);
    }

    @PostMapping("/presign")
    public PresignUploadResponse presign(@RequestBody PresignUploadRequest r) {
        return docs.presignUpload(userId(), r, presignTtlSeconds);
    }

    @PostMapping("/{id}/complete")
    public DocumentResponse complete(@PathVariable Long id, @RequestBody(required = false) CompleteUploadRequest r) {
        return docs.completeUpload(userId(), id, r);
    }
}
