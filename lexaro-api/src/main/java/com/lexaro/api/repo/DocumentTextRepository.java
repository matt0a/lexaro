package com.lexaro.api.repo;

import com.lexaro.api.domain.DocumentText;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface DocumentTextRepository extends JpaRepository<DocumentText, Long> {
    Optional<DocumentText> findByDocId(Long docId);
}
