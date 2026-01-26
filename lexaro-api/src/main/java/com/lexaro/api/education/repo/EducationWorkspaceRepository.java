package com.lexaro.api.education.repo;

import com.lexaro.api.education.domain.EducationWorkspace;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EducationWorkspaceRepository extends JpaRepository<EducationWorkspace, Long> {
    List<EducationWorkspace> findByUserIdOrderByCreatedAtDesc(Long userId);
}
