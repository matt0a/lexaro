package com.lexaro.api.service;

import com.lexaro.api.domain.DocStatus;
import com.lexaro.api.domain.Document;
import com.lexaro.api.repo.DocumentRepository;
import com.lexaro.api.repo.UserRepository;
import com.lexaro.api.web.dto.CreateMetadataRequest;
import com.lexaro.api.web.dto.DocumentResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class DocumentService {
    private final DocumentRepository docs;
    private final UserRepository users;
    private final PlanService plans;

    @Transactional
    public DocumentResponse createMetadata(Long userId, CreateMetadataRequest r) {
        var user = users.findById(userId).orElseThrow();

        if (r.sizeBytes() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "sizeBytes must be > 0");
        }
        if (r.pages() != null && r.pages() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "pages must be >= 0");
        }

        // Enforce plan limits unless the user is unlimited
        boolean unlimited = plans.isUnlimited(user);
        if (!unlimited) {
            if (r.sizeBytes() > plans.maxBytesFor(user)) {
                throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "File too big for current plan");
            }
            if (r.pages() != null && r.pages() > plans.maxPagesFor(user)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Too many pages for current plan");
            }
        }

        var now = Instant.now();

        // Compute retention (unlimited will effectively be "very long" via PlanService)
        int retentionDays = plans.retentionDaysFor(user);
        Instant expiresAt = retentionDays > 0 ? now.plusSeconds(86400L * retentionDays) : null;

        var doc = Document.builder()
                .user(user)
                .filename(r.filename())
                .mime(r.mime())
                .sizeBytes(r.sizeBytes())
                .sha256(r.sha256())
                .pages(r.pages())
                .status(DocStatus.READY)              // metadata-only path -> READY
                .uploadedAt(now)
                .expiresAt(expiresAt)                 // <-- set correctly
                .planAtUpload(plans.effectivePlan(user)) // shows PREMIUM for unlimited if that's your choice
                .build();

        var saved = docs.save(doc);
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public Page<DocumentResponse> list(Long userId, Pageable pageable) {
        return docs.findByUserIdAndDeletedAtIsNull(userId, pageable).map(this::toDto);
    }

    // Pure mapper: does NOT touch d.getUser() (avoids LazyInitializationException)
    private DocumentResponse toDto(Document d) {
        return new DocumentResponse(
                d.getId(),
                d.getFilename(),
                d.getMime(),
                d.getSizeBytes(),
                d.getPages(),
                d.getStatus().name(),
                d.getUploadedAt(),
                d.getExpiresAt(),
                d.getPlanAtUpload().name()
        );
    }
}
