package com.lexaro.api.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity @Table(name="documents")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Document {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name="user_id", nullable=false)
    private User user;

    @Column(nullable=false) private String filename;
    @Column(nullable=false) private String mime;
    @Column(name="size_bytes", nullable=false) private long sizeBytes;

    @Column(length=64) private String sha256;   // optional
    private Integer pages;                      // optional

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private DocStatus status;

    @Column(name="uploaded_at", nullable=false)
    private Instant uploadedAt;

    @Column(name="expires_at")
    private Instant expiresAt; // free path = null (no stored audio), premium later will set

    @Column(name="deleted_at")
    private Instant deletedAt;

    @Enumerated(EnumType.STRING)
    @Column(name="plan_at_upload", nullable=false)
    private Plan planAtUpload;
}
