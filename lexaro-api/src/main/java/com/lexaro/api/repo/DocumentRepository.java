package com.lexaro.api.repo;

import com.lexaro.api.domain.AudioStatus;
import com.lexaro.api.domain.Document;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface DocumentRepository extends JpaRepository<Document, Long> {
    Page<Document> findByUserIdAndDeletedAtIsNull(Long userId, Pageable pageable);
    Optional<Document> findByIdAndUserIdAndDeletedAtIsNull(Long id, Long userId);
    List<Document> findTop100ByExpiresAtIsNotNullAndExpiresAtBeforeAndDeletedAtIsNull(Instant cutoff);
    @EntityGraph(attributePaths = "user")
    Optional<Document> findByIdAndUserId(Long id, Long userId);
    long countByUserIdAndAudioStatus(Long userId, AudioStatus status);
    @Override
    void flush();
}
