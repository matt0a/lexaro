package com.lexaro.api.web;

import com.lexaro.api.service.DocumentService;
import com.lexaro.api.web.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/documents")
@RequiredArgsConstructor
public class DocumentController {
    private final DocumentService docs;

    @Value("${app.upload.presignTtlSeconds:900}")
    private int presignTtlSeconds;

    @Value("${app.download.presignTtlSeconds:300}")
    private int defaultDownloadTtl;

    /**
     * Maximum number of items returned per page.
     * Clients requesting more than this will receive exactly {@code maxPageSize} items.
     * Prevents abuse via artificially large page requests (e.g. {@code size=10000}).
     */
    @Value("${app.pagination.max-size:50}")
    private int maxPageSize;

    /**
     * Default page size used when the client supplies {@code size < 1}.
     */
    @Value("${app.pagination.default-size:20}")
    private int defaultPageSize;

    private Long userId() {
        return (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    /**
     * Builds a safe {@link Pageable} from raw request parameters.
     *
     * <p>Clamping strategy:
     * <ul>
     *   <li>{@code size < 1} → {@code defaultPageSize} (bad client, use sensible default)</li>
     *   <li>{@code size > maxPageSize} → {@code maxPageSize} (prevent oversized requests)</li>
     *   <li>{@code page < 0} → 0 (prevent negative page index)</li>
     * </ul>
     *
     * <p>Existing clients sending {@code size=20} are unaffected; only abusive or
     * misconfigured sizes are silently corrected.
     *
     * @param page raw page index from the request
     * @param size raw page size from the request
     * @param sort desired sort order
     * @return a clamped, safe {@link Pageable}
     */
    private Pageable safePage(int page, int size, Sort sort) {
        int safeSize = size < 1 ? defaultPageSize : Math.min(size, maxPageSize);
        int safePage = Math.max(0, page);
        return PageRequest.of(safePage, safeSize, sort);
    }

    // FREE path: create a library entry without uploading any file to the server
    @PostMapping("/metadata")
    public DocumentResponse create(@RequestBody CreateMetadataRequest r) {
        return docs.createMetadata(userId(), r);
    }

    @GetMapping
    public Page<DocumentResponse> list(@RequestParam(defaultValue = "0") int page,
                                       @RequestParam(defaultValue = "20") int size,
                                       @RequestParam(required = false) String purpose) {
        var pageable = safePage(page, size, Sort.by(Sort.Direction.DESC, "uploadedAt"));
        return docs.list(userId(), pageable, purpose);
    }

    @PostMapping("/presign")
    public PresignUploadResponse presign(@RequestBody PresignUploadRequest r) {
        return docs.presignUpload(userId(), r, presignTtlSeconds);
    }

    @PostMapping("/{id}/complete")
    public DocumentResponse complete(@PathVariable Long id, @RequestBody(required = false) CompleteUploadRequest r) {
        return docs.completeUpload(userId(), id, r);
    }

    @GetMapping("/{id}/download")
    public PresignDownloadResponse download(
            @PathVariable Long id,
            @RequestParam(value = "ttlSeconds", required = false) Integer ttl) {
        // clamp so a client can’t request a huge/too-small TTL
        int ttlSeconds = (ttl == null) ? defaultDownloadTtl : Math.max(30, Math.min(ttl, 3600));
        return docs.presignDownload(userId(), id, ttlSeconds);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        docs.delete(userId(), id);
    }
}
