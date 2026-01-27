package com.lexaro.api.service;

import com.lexaro.api.domain.AudioStatus;
import com.lexaro.api.domain.DocStatus;
import com.lexaro.api.domain.Document;
import com.lexaro.api.domain.DocumentPurpose;
import com.lexaro.api.domain.User;
import com.lexaro.api.repo.DocumentRepository;
import com.lexaro.api.repo.UserRepository;
import com.lexaro.api.storage.StorageService;
import com.lexaro.api.web.dto.*;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
public class DocumentService {

    private final DocumentRepository docs;
    private final UserRepository users;
    private final PlanService plans;
    private final StorageService storage;

    public DocumentService(
            DocumentRepository docs,
            UserRepository users,
            PlanService plans,
            @Qualifier("storageService") StorageService storage
    ) {
        this.docs = docs;
        this.users = users;
        this.plans = plans;
        this.storage = storage;
    }

    // -------- FREE path ----------

    @Transactional
    public DocumentResponse createMetadata(Long userId, CreateMetadataRequest r) {
        var user = users.findById(userId).orElseThrow();
        validateBasics(r.filename(), r.mime(), r.sizeBytes(), r.pages());

        if (!plans.isUnlimited(user)) {
            enforcePlanLimits(user, r.sizeBytes(), r.pages());
        }

        DocumentPurpose purpose = DocumentPurpose.fromNullable(r.purpose());

        var now = Instant.now();
        var doc = Document.builder()
                .user(user)
                .filename(r.filename())
                .mime(r.mime())
                .sizeBytes(r.sizeBytes())
                .sha256(r.sha256())
                .pages(r.pages())
                .purpose(purpose)
                .status(DocStatus.READY)
                .uploadedAt(now)
                .expiresAt(null)
                .planAtUpload(plans.effectivePlan(user))
                .build();

        return toDto(docs.save(doc));
    }

    public Page<DocumentResponse> list(Long userId, Pageable pageable) {
        return docs.findByUserIdAndDeletedAtIsNull(userId, pageable).map(this::toDto);
    }

    // ✅ purpose-filtered list
    public Page<DocumentResponse> list(Long userId, Pageable pageable, String purposeRaw) {
        if (purposeRaw == null || purposeRaw.isBlank()) {
            return list(userId, pageable);
        }

        DocumentPurpose p = DocumentPurpose.fromNullable(purposeRaw);

        List<DocumentPurpose> allowed = switch (p) {
            case AUDIO -> List.of(DocumentPurpose.AUDIO, DocumentPurpose.BOTH);
            case EDUCATION -> List.of(DocumentPurpose.EDUCATION, DocumentPurpose.BOTH);
            case BOTH -> List.of(DocumentPurpose.BOTH);
        };

        return docs.findByUserIdAndDeletedAtIsNullAndPurposeIn(userId, allowed, pageable).map(this::toDto);
    }

    // -------- PREMIUM path ----------

    @Transactional
    public PresignUploadResponse presignUpload(Long userId, PresignUploadRequest r, int presignTtlSeconds) {
        var user = users.findById(userId).orElseThrow();
        validateBasics(r.filename(), r.mime(), r.sizeBytes(), r.pages());

        if (!plans.isUnlimited(user)) {
            enforcePlanLimits(user, r.sizeBytes(), r.pages());
        }

        DocumentPurpose purpose = DocumentPurpose.fromNullable(r.purpose());

        int ttl = Math.max(60, Math.min(presignTtlSeconds, 3600));

        String objectKey = "u/%d/%s/%s".formatted(userId, UUID.randomUUID(), sanitize(r.filename()));

        var now = Instant.now();
        var doc = Document.builder()
                .user(user)
                .filename(r.filename())
                .mime(r.mime())
                .sizeBytes(r.sizeBytes())
                .pages(r.pages())
                .purpose(purpose)
                .status(DocStatus.UPLOADED)
                .uploadedAt(now)
                .planAtUpload(plans.effectivePlan(user))
                .objectKey(objectKey)
                .build();

        doc = docs.save(doc);

        // IMPORTANT: presign WITHOUT content-length
        var p = storage.presignPut(objectKey, r.mime(), ttl);

        return new PresignUploadResponse(doc.getId(), objectKey, p.url(), p.headers(), p.expiresInSeconds());
    }

    @Transactional
    public DocumentResponse completeUpload(Long userId, Long docId, CompleteUploadRequest body) {
        var doc = docs.findByIdAndUserId(docId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));

        if (doc.getStatus() != DocStatus.UPLOADED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Document is not in UPLOADED state");
        }
        if (doc.getObjectKey() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Missing object key");
        }
        if (!storage.exists(doc.getObjectKey())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Object not found in storage");
        }

        long actual = storage.size(doc.getObjectKey());
        if (actual != doc.getSizeBytes()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Size mismatch");
        }

        if (body != null && body.sha256() != null && !body.sha256().isBlank()) {
            doc.setSha256(body.sha256());
        }

        int days = plans.retentionDaysFor(doc.getUser());
        doc.setExpiresAt(days > 0 ? Instant.now().plus(days, ChronoUnit.DAYS) : null);
        doc.setStatus(DocStatus.READY);

        return toDto(docs.save(doc));
    }

    // -------- Download helpers ----------

    @Transactional(readOnly = true)
    public PresignDownloadResponse presignDownload(Long userId, Long id, int ttlSeconds) {
        int ttl = Math.max(60, Math.min(ttlSeconds, 3600));

        var doc = docs.findByIdAndUserIdAndDeletedAtIsNull(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));
        if (doc.getObjectKey() == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No stored object for this document");
        if (doc.getStatus() != DocStatus.READY)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Document not ready");

        var p = storage.presignGet(doc.getObjectKey(), ttl);
        return new PresignDownloadResponse(doc.getId(), doc.getObjectKey(), p.url(), p.headers(), ttl);
    }

    @Transactional(readOnly = true)
    public PresignDownloadResponse presignAudioDownload(Long userId, Long docId, int ttlSeconds) {
        int ttl = Math.max(60, Math.min(ttlSeconds, 3600));

        var doc = docs.findByIdAndUserId(docId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));

        if (doc.getAudioStatus() != AudioStatus.READY || doc.getAudioObjectKey() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Audio not ready");
        }

        var base = (doc.getFilename() == null ? "audio" : doc.getFilename().replaceAll("\\.pdf$", ""));
        var ext  = (doc.getAudioFormat() == null ? "mp3" : doc.getAudioFormat().toLowerCase());
        var nice = base + "." + ext;

        String contentType = switch (ext) {
            case "ogg" -> "audio/ogg";
            case "pcm" -> "audio/wave";
            default    -> "audio/mpeg"; // mp3
        };

        var p = storage.presignGet(
                doc.getAudioObjectKey(),
                ttl,
                contentType,
                "attachment; filename=\"" + nice + "\""
        );
        return new PresignDownloadResponse(doc.getId(), doc.getAudioObjectKey(), p.url(), p.headers(), ttl);
    }

    @Transactional
    public void delete(Long userId, Long id) {
        var doc = docs.findByIdAndUserIdAndDeletedAtIsNull(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));

        // best-effort physical deletes (pdf + audio)
        if (doc.getObjectKey() != null) {
            try { storage.delete(doc.getObjectKey()); } catch (Exception ignored) {}
        }
        if (doc.getAudioObjectKey() != null) {
            try { storage.delete(doc.getAudioObjectKey()); } catch (Exception ignored) {}
        }

        doc.setDeletedAt(Instant.now());
        doc.setStatus(DocStatus.EXPIRED);
        doc.setAudioStatus(AudioStatus.FAILED);
        docs.save(doc);
    }

    // -------- internals ----------

    private void validateBasics(String filename, String mime, long sizeBytes, Integer pages) {
        if (sizeBytes <= 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "sizeBytes must be > 0");
        if (pages != null && pages < 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "pages must be >= 0");
        if (filename == null || filename.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "filename required");
        if (mime == null || mime.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "mime required");
    }

    private void enforcePlanLimits(User user, long sizeBytes, Integer pages) {
        if (sizeBytes > plans.maxBytesFor(user))
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "File too big for current plan");
        if (pages != null && pages > plans.maxPagesFor(user))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Too many pages for current plan");
    }

    private static String sanitize(String name) {
        return name.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

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
