package com.lexaro.api.education.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "document_text_chunks", schema = "public",
        indexes = {
                @Index(name = "idx_doc_chunks_doc", columnList = "doc_id"),
                @Index(name = "idx_doc_chunks_doc_page", columnList = "doc_id,page_start"),
                @Index(name = "idx_doc_chunks_topic", columnList = "topic_tag")
        }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class DocumentTextChunk {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="doc_id", nullable = false)
    private Long docId;

    @Column(name="chunk_index", nullable = false)
    private Integer chunkIndex;

    @Column(name="page_start")
    private Integer pageStart;

    @Column(name="page_end")
    private Integer pageEnd;

    @Column(name="start_char")
    private Integer startChar;

    @Column(name="end_char")
    private Integer endChar;

    @Lob
    @Column(columnDefinition = "text", nullable = false)
    private String text;

    @Column(name="topic_tag")
    private String topicTag;

    @Column(name="created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
    }
}
