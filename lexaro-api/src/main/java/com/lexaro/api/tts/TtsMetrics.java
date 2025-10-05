package com.lexaro.api.tts;

import io.micrometer.core.instrument.*;
import org.springframework.stereotype.Component;

@Component
public class TtsMetrics {
    private final Counter started;
    private final Counter succeeded;
    private final Counter failed;
    private final Timer pollyLatency;

    public TtsMetrics(MeterRegistry reg) {
        this.started   = Counter.builder("tts.jobs.started").register(reg);
        this.succeeded = Counter.builder("tts.jobs.succeeded").register(reg);
        this.failed    = Counter.builder("tts.jobs.failed").register(reg);
        this.pollyLatency = Timer.builder("polly.synthesize.latency")
                .publishPercentiles(0.5, 0.95, 0.99).register(reg);
    }
    public void incStarted(){ started.increment(); }
    public void incSucceeded(){ succeeded.increment(); }
    public void incFailed(){ failed.increment(); }
    public <T> T timePolly(java.util.concurrent.Callable<T> c) throws Exception {
        return pollyLatency.recordCallable(c);
    }
}
