package com.lexaro.api.education.service.impl;

import com.lexaro.api.domain.User;
import com.lexaro.api.education.domain.AttemptMode;
import com.lexaro.api.education.domain.AttemptType;
import com.lexaro.api.education.domain.EducationAttemptEvent;
import com.lexaro.api.education.domain.EducationUserStats;
import com.lexaro.api.education.repo.EducationAttemptEventRepository;
import com.lexaro.api.education.repo.EducationUserStatsRepository;
import com.lexaro.api.education.repo.dto.*;
import com.lexaro.api.education.service.EducationProgressService;
import com.lexaro.api.education.service.EducationUserContextService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class EducationProgressServiceImpl implements EducationProgressService {

    private final EducationUserContextService userContext;
    private final EducationAttemptEventRepository attemptRepo;
    private final EducationUserStatsRepository statsRepo;

    @Override
    @Transactional
    public EducationAttemptEventDto recordAttempt(EducationAttemptCreateRequest req) {
        User user = userContext.requireCurrentUser();

        EducationAttemptEvent ev = new EducationAttemptEvent();
        ev.setUserId(user.getId());
        ev.setDocId(req.getDocId());
        ev.setAttemptType(parseAttemptType(req.getAttemptType()));
        ev.setMode(parseAttemptMode(req.getMode()));
        ev.setScore(req.getScore());
        ev.setMaxScore(req.getMaxScore());
        ev.setPercent(req.getPercent());
        ev.setWeakTopics(req.getWeakTopics() == null ? null : req.getWeakTopics().toArray(new String[0]));

        ev = attemptRepo.save(ev);

        recomputeAndUpsertStats(user.getId());

        return toDto(ev);
    }

    @Override
    public EducationProgressSummaryDto getSummary() {
        User user = userContext.requireCurrentUser();
        EducationUserStats s = statsRepo.findById(user.getId()).orElseGet(() -> {
            EducationUserStats created = new EducationUserStats();
            created.setUserId(user.getId());
            created.setStreakDays(0);
            created.setAttemptsLast30(0);
            return created;
        });

        return EducationProgressSummaryDto.builder()
                .streakDays(s.getStreakDays())
                .lastStudyAt(s.getLastStudyAt())
                .avgAccuracy(s.getAvgAccuracy())
                .attemptsLast30(s.getAttemptsLast30())
                .build();
    }

    @Override
    public List<EducationAttemptEventDto> getAttempts(int days, int limit) {
        User user = userContext.requireCurrentUser();
        Instant since = Instant.now().minus(Duration.ofDays(Math.max(days, 1)));
        return attemptRepo.findRecent(user.getId(), since, limit).stream().map(this::toDto).toList();
    }

    @Override
    public List<EducationWeakTopicDto> getWeakTopics(int days, int limit) {
        User user = userContext.requireCurrentUser();
        Instant since = Instant.now().minus(Duration.ofDays(Math.max(days, 1)));
        return attemptRepo.findWeakTopics(user.getId(), since, limit).stream()
                .map(r -> EducationWeakTopicDto.builder()
                        .topic((String) r[0])
                        .count(((Number) r[1]).longValue())
                        .build())
                .toList();
    }

    private void recomputeAndUpsertStats(long userId) {
        Instant now = Instant.now();
        Instant since30 = now.minus(Duration.ofDays(30));

        int attemptsLast30 = attemptRepo.countAttemptsLast30(userId, since30);
        Double avg = attemptRepo.avgPercentLast30(userId, since30);

        int streak = attemptRepo.computeStreakDays(userId);

        EducationUserStats s = statsRepo.findById(userId).orElseGet(() -> {
            EducationUserStats created = new EducationUserStats();
            created.setUserId(userId);
            return created;
        });

        s.setAttemptsLast30(attemptsLast30);
        s.setAvgAccuracy(avg);
        s.setStreakDays(streak);
        s.setLastStudyAt(now);

        statsRepo.save(s);
    }

    private EducationAttemptEventDto toDto(EducationAttemptEvent ev) {
        List<String> weak = ev.getWeakTopics() == null ? null : List.of(ev.getWeakTopics());
        return EducationAttemptEventDto.builder()
                .id(ev.getId())
                .docId(ev.getDocId())
                .attemptType(ev.getAttemptType() == null ? null : ev.getAttemptType().name())
                .mode(ev.getMode() == null ? null : ev.getMode().name())
                .score(ev.getScore())
                .maxScore(ev.getMaxScore())
                .percent(ev.getPercent())
                .weakTopics(weak)
                .createdAt(ev.getCreatedAt())
                .build();
    }

    private AttemptType parseAttemptType(String raw) {
        return parseEnum(raw, AttemptType.class);
    }

    private AttemptMode parseAttemptMode(String raw) {
        return parseEnum(raw, AttemptMode.class);
    }

    private static <E extends Enum<E>> E parseEnum(String raw, Class<E> enumClass) {
        if (raw == null) return null;
        String norm = raw.trim();
        if (norm.isEmpty()) return null;
        norm = norm.toUpperCase(Locale.ROOT)
                .replace("-", "_")
                .replace(" ", "_");
        return Enum.valueOf(enumClass, norm);
    }
}
