package com.lexaro.api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "ttsExecutor")
    public Executor ttsExecutor() {
        var ex = new ThreadPoolTaskExecutor();
        ex.setThreadNamePrefix("tts-");
        ex.setCorePoolSize(4);      // tune as needed
        ex.setMaxPoolSize(8);
        ex.setQueueCapacity(50);
        ex.initialize();
        return ex;
    }
}
