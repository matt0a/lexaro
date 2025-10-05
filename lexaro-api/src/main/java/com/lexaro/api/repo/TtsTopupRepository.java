package com.lexaro.api.repo;

import com.lexaro.api.tts.TtsTopup;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface TtsTopupRepository extends JpaRepository<TtsTopup, Long> {
    @Query("select coalesce(sum(t.chars),0) from TtsTopup t where t.userId = :uid and t.periodYm = :p")
    long sumForPeriod(@Param("uid") long userId, @Param("p") String periodYm);
}
