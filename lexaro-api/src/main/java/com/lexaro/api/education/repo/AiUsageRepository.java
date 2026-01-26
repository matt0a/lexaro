package com.lexaro.api.education.repo;

import com.lexaro.api.education.domain.AiUsage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;

public interface AiUsageRepository extends JpaRepository<AiUsage, Long> {

    Optional<AiUsage> findByUserIdAndFeatureKeyAndWindowStartAndWindowEnd(
            Long userId, String featureKey, Instant windowStart, Instant windowEnd
    );

}
