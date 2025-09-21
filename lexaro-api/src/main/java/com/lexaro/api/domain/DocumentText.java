package com.lexaro.api.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Entity
@Table(name = "document_texts")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DocumentText {
    @Id
    @Column(name = "doc_id")
    private Long docId;

    @OneToOne(fetch = FetchType.LAZY) @MapsId
    @JoinColumn(name = "doc_id")
    private Document document;

    @Version
    @Column(name = "version")   // BIGINT in DB
    private Long version;

    @Column(nullable = false) private String mime;
    @JdbcTypeCode(SqlTypes.LONGVARCHAR)
    @Column(name = "text", columnDefinition = "text", nullable = false)
    private String text;
    @Column(name = "char_count", nullable = false) private int charCount;
    @Column(name = "extracted_at", nullable = false) private Instant extractedAt;
}
