package com.lexaro.api.education.repo;

import com.lexaro.api.education.domain.EducationAttemptEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface EducationAttemptEventRepository extends JpaRepository<EducationAttemptEvent, Long> {
    List<EducationAttemptEvent> findTop50ByUserIdOrderByCreatedAtDesc(Long userId);


    @Query("""
        select e from EducationAttemptEvent e
        where e.userId = :userId and e.createdAt >= :since
        order by e.createdAt desc
    """)
    List<EducationAttemptEvent> findRecentRaw(@Param("userId") long userId, @Param("since") Instant since);

    default List<EducationAttemptEvent> findRecent(long userId, Instant since, int limit) {
        List<EducationAttemptEvent> all = findRecentRaw(userId, since);
        return all.size() <= limit ? all : all.subList(0, limit);
    }

    @Query("""
        select count(e) from EducationAttemptEvent e
        where e.userId = :userId and e.createdAt >= :since
    """)
    int countAttemptsLast30(@Param("userId") long userId, @Param("since") Instant since);

    @Query("""
        select avg(e.percent) from EducationAttemptEvent e
        where e.userId = :userId and e.createdAt >= :since and e.percent is not null
    """)
    Double avgPercentLast30(@Param("userId") long userId, @Param("since") Instant since);

    /**
     * Weak topics aggregation (Postgres): unnest the text[] column.
     */
    @Query(value = """
        select t.topic as topic, count(*) as cnt
        from education_attempt_event e
        join lateral unnest(e.weak_topics) as t(topic) on true
        where e.user_id = :userId and e.created_at >= :since
        group by t.topic
        order by cnt desc
        limit :limit
    """, nativeQuery = true)
    List<Object[]> findWeakTopics(@Param("userId") long userId, @Param("since") Instant since, @Param("limit") int limit);

    /**
     * Streak days: count consecutive days ending today with >=1 attempt.
     * Uses Postgres date_trunc and generates series.
     */
    @Query(value = """
        with days as (
            select generate_series(
                date_trunc('day', now())::date - interval '120 days',
                date_trunc('day', now())::date,
                interval '1 day'
            )::date as d
        ),
        has_attempt as (
            select date_trunc('day', created_at)::date as d, count(*) as c
            from education_attempt_event
            where user_id = :userId
            group by 1
        ),
        joined as (
            select days.d, coalesce(has_attempt.c, 0) as c
            from days
            left join has_attempt on has_attempt.d = days.d
            order by days.d desc
        )
        select count(*)::int
        from (
            select d, c,
                   sum(case when c = 0 then 1 else 0 end) over (order by d desc rows between unbounded preceding and current row) as breaks
            from joined
        ) x
        where x.breaks = 0 and x.c > 0
    """, nativeQuery = true)
    int computeStreakDays(@Param("userId") long userId);
}
