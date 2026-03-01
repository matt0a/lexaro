package com.lexaro.api.config;

import com.lexaro.api.domain.AudioStatus;
import com.lexaro.api.repo.DocumentRepository;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Registers custom Micrometer metrics for TTS job observability that are not already
 * covered by {@link com.lexaro.api.tts.TtsMetrics}.
 *
 * <p>Note: {@code tts.jobs.started}, {@code tts.jobs.succeeded}, and {@code tts.jobs.failed}
 * counters are already registered by {@link com.lexaro.api.tts.TtsMetrics}. Re-registering
 * them here would cause a {@code MeterAlreadyExistsException} at startup, so only the
 * pending-jobs Gauge is added here.
 *
 * <p>Metrics registered here are exposed at {@code /actuator/prometheus} and can be used
 * to alert on:
 * <ul>
 *   <li>{@code tts.jobs.pending} – rising value indicates processing backlog.</li>
 * </ul>
 *
 * <p>The Gauge polls {@link DocumentRepository#countByAudioStatus(AudioStatus)} on every
 * Prometheus scrape. This is a single COUNT query — not an N+1 — and is acceptable as a
 * scrape-time operation.
 */
@Configuration
@RequiredArgsConstructor
public class MetricsConfig {

    /** Repository used to count documents currently in PROCESSING state. */
    private final DocumentRepository documentRepository;

    /**
     * Gauge that reports the number of documents whose {@code audio_status} is
     * {@link AudioStatus#PROCESSING} at scrape time.
     *
     * <p>A sustained non-zero value indicates in-flight jobs; a growing value over time
     * indicates a processing backlog worth alerting on.
     *
     * @param registry the Micrometer MeterRegistry, auto-wired by Spring Boot Actuator
     * @return the registered Gauge instance
     */
    @Bean
    public Gauge ttsJobsPending(MeterRegistry registry) {
        return Gauge.builder("tts.jobs.pending", documentRepository,
                        repo -> (double) repo.countByAudioStatus(AudioStatus.PROCESSING))
                .description("Number of documents currently being processed for audio")
                .register(registry);
    }
}
