package com.lexaro.api.education.repo;

import com.lexaro.api.education.domain.DocumentTextChunk;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentTextChunkRepository extends JpaRepository<DocumentTextChunk, Long> {

    List<DocumentTextChunk> findByDocIdOrderByChunkIndexAsc(Long docId);

    List<DocumentTextChunk> findByDocIdAndPageEndGreaterThanEqualAndPageStartLessThanEqualOrderByChunkIndexAsc(
            Long docId, Integer pageStart, Integer pageEnd
    );

    long deleteByDocId(Long docId);
}
