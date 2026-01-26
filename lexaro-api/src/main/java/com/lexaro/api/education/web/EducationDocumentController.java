package com.lexaro.api.education.web;

import com.lexaro.api.education.repo.dto.ChunkSearchResponse;
import com.lexaro.api.education.repo.dto.IndexDocumentResponse;
import com.lexaro.api.education.service.ChunkSearchService;
import com.lexaro.api.education.service.DocumentIndexService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/education")
public class EducationDocumentController {

    private final DocumentIndexService documentIndexService;
    private final ChunkSearchService chunkSearchService;

    @PostMapping("/documents/{docId}/index")
    public IndexDocumentResponse index(@PathVariable Long docId) {
        return documentIndexService.indexDocument(docId);
    }

    /**
     * Preferred search endpoint (POST) to avoid URL length/encoding issues.
     */
    @PostMapping("/documents/{docId}/chunks/search")
    public ChunkSearchResponse searchPost(
            @PathVariable Long docId,
            @RequestBody ChunkSearchRequest req
    ) {
        return chunkSearchService.search(
                docId,
                req.getQ(),
                req.getPageStart(),
                req.getPageEnd(),
                req.getLimit()
        );
    }

    /**
     * Backward-compatible GET endpoint (safe to remove later if you want).
     */
    @GetMapping("/documents/{docId}/chunks/search")
    public ChunkSearchResponse searchGet(
            @PathVariable Long docId,
            @RequestParam("q") String q,
            @RequestParam(value = "pageStart", required = false) Integer pageStart,
            @RequestParam(value = "pageEnd", required = false) Integer pageEnd,
            @RequestParam(value = "limit", required = false) Integer limit
    ) {
        return chunkSearchService.search(docId, q, pageStart, pageEnd, limit);
    }

    @Data
    public static class ChunkSearchRequest {
        private String q;
        private Integer pageStart;
        private Integer pageEnd;
        private Integer limit;
    }
}
