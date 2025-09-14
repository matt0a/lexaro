package com.lexaro.api.web;

import com.lexaro.api.service.DocumentService;
import com.lexaro.api.web.dto.CreateMetadataRequest;
import com.lexaro.api.web.dto.DocumentResponse;
import lombok.RequiredArgsConstructor;
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
}
