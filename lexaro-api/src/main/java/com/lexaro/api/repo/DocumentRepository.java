package com.lexaro.api.repo;

import com.lexaro.api.domain.Document;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DocumentRepository extends JpaRepository<Document, Long> {
    Page<Document> findByUserIdAndDeletedAtIsNull(Long userId, Pageable pageable);
    Optional<Document> findByIdAndUserId(Long id, Long userId);
}
