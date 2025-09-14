package com.lexaro.api.repo;

import com.lexaro.api.domain.Document;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DocumentRepository extends JpaRepository<Document, Long> {
    Page<Document> findByUserIdAndDeletedAtIsNull(Long userId, Pageable pageable);
}
