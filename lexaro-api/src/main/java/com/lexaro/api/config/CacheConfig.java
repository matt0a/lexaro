package com.lexaro.api.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.cache.CacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Configures Caffeine-backed Spring Cache with per-cache TTLs and maximum sizes.
 *
 * <p>Uses {@link SimpleCacheManager} with individually built {@link CaffeineCache} instances
 * so that each cache can have its own TTL and size bound. This is more explicit than
 * {@code CaffeineCacheManager} (which shares a single spec across all caches) and avoids
 * any API version ambiguity with {@code registerCustomCache}.
 *
 * <p>Cache names used across the application:
 * <ul>
 *   <li>{@code plan-caps}       — per-plan char/page/size caps; sourced from @Value fields,
 *                                  changes only on re-deploy. 24-hour TTL, max 50 entries.</li>
 *   <li>{@code effective-plan}  — per-user effective plan resolution; changes only on
 *                                  upgrade/downgrade. 1-hour TTL, max 10 000 entries.</li>
 *   <li>{@code tts-quota}       — per-user monthly char usage read from DB; must not stay
 *                                  stale long. 5-minute TTL, max 10 000 entries.</li>
 *   <li>{@code documents-list}  — paginated document list per user; evicted on upload/delete.
 *                                  2-minute TTL, max 5 000 entries.</li>
 *   <li>{@code document-meta}   — single-document metadata per user+docId; evicted on delete.
 *                                  5-minute TTL, max 10 000 entries.</li>
 *   <li>{@code voices-catalog}  — static Polly/Speechify voice catalog per plan tier.
 *                                  24-hour TTL, max 10 entries (one per plan tier variant).</li>
 * </ul>
 *
 * <p>Security note: {@code document-meta} and {@code documents-list} cache keys MUST include
 * the {@code userId} prefix (enforced at each {@code @Cacheable} call site) so that one
 * user can never read another user's cached document data.
 *
 * <p>{@code @EnableCaching} lives here, not on {@code @SpringBootApplication}, keeping
 * caching infrastructure isolated in this configuration class.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    /** TTL for per-plan capability lookups (seconds). Default 24 hours. */
    @Value("${app.cache.plan-caps.ttl-seconds:86400}")
    private long planCapsTtl;

    /** TTL for per-user effective plan resolution (seconds). Default 1 hour. */
    @Value("${app.cache.effective-plan.ttl-seconds:3600}")
    private long effectivePlanTtl;

    /** TTL for per-user monthly TTS char usage (seconds). Default 5 minutes. */
    @Value("${app.cache.tts-quota.ttl-seconds:300}")
    private long ttsQuotaTtl;

    /** TTL for paginated document lists per user (seconds). Default 2 minutes. */
    @Value("${app.cache.documents-list.ttl-seconds:120}")
    private long documentsListTtl;

    /** TTL for single document metadata per user+docId (seconds). Default 5 minutes. */
    @Value("${app.cache.document-meta.ttl-seconds:300}")
    private long documentMetaTtl;

    /** TTL for the static voice catalog from Polly/Speechify (seconds). Default 24 hours. */
    @Value("${app.cache.voices-catalog.ttl-seconds:86400}")
    private long voicesCatalogTtl;

    /**
     * Builds and returns the Spring {@link CacheManager} backed by Caffeine.
     *
     * <p>Each cache is constructed individually via {@link #buildCache(String, long, int)}
     * and registered with a {@link SimpleCacheManager}. This gives full control over
     * per-cache TTL and maximum entry count without relying on shared spec strings.
     *
     * @return configured CacheManager
     */
    @Bean
    public CacheManager cacheManager() {
        SimpleCacheManager manager = new SimpleCacheManager();
        manager.setCaches(List.of(
                // Static plan cap lookups: key = plan enum name (e.g. "FREE", "PREMIUM")
                buildCache("plan-caps", planCapsTtl, 50),

                // Per-user effective plan: key = userId
                buildCache("effective-plan", effectivePlanTtl, 10_000),

                // Per-user monthly TTS char usage: key = userId + ':' + YearMonth
                buildCache("tts-quota", ttsQuotaTtl, 10_000),

                // Paginated document list per user: key = userId + ':' + page + ':' + size + ':' + purpose
                buildCache("documents-list", documentsListTtl, 5_000),

                // Single document metadata: key = userId + ':' + docId
                buildCache("document-meta", documentMetaTtl, 10_000),

                // Voice catalog per plan tier: key = normalized plan string (e.g. "FREE", "PREMIUM")
                buildCache("voices-catalog", voicesCatalogTtl, 10)
        ));
        return manager;
    }

    /**
     * Constructs a named {@link CaffeineCache} with the given TTL and maximum size.
     *
     * <p>{@code allowNullValues} is {@code false}: services must return non-null values
     * from cacheable methods (empty collections are fine; null would cause a NullPointerException
     * in the cache abstraction and masks bugs).
     *
     * @param name       the cache name used in {@code @Cacheable(cacheNames = ...)}
     * @param ttlSeconds time-to-live after write, in seconds
     * @param maxSize    maximum number of entries before Caffeine evicts by LRU
     * @return a configured CaffeineCache instance
     */
    private CaffeineCache buildCache(String name, long ttlSeconds, int maxSize) {
        return new CaffeineCache(
                name,
                Caffeine.newBuilder()
                        .expireAfterWrite(ttlSeconds, TimeUnit.SECONDS)
                        .maximumSize(maxSize)
                        .build(),
                /* allowNullValues = */ false
        );
    }
}
