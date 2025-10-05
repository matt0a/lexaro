package com.lexaro.api.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@EnableConfigurationProperties(RateLimitProperties.class)
public class RateLimitConfig {

    /** Per-IP for /auth/** */
    @Component
    @Order(10)
    public static class AuthRateLimitFilter implements Filter {
        private final RateLimitProperties props;
        private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

        public AuthRateLimitFilter(RateLimitProperties props) { this.props = props; }

        @Override public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
                throws IOException, ServletException {
            var r = (HttpServletRequest) req;
            var w = (HttpServletResponse) res;

            if (!props.auth.enabled || !r.getRequestURI().startsWith("/auth/")) {
                chain.doFilter(req, res); return;
            }
            String ip = req.getRemoteAddr();
            Bucket b = buckets.computeIfAbsent(ip, k -> newBucket(props.auth));
            if (b.tryConsume(1)) {
                chain.doFilter(req, res);
            } else {
                w.setStatus(429);
                w.getWriter().write("{\"error\":\"Too many requests\"}");
            }
        }

        private Bucket newBucket(RateLimitProperties.Section s) {
            var refill = Refill.greedy(s.refillTokens, Duration.ofSeconds(s.refillSeconds));
            var bw = Bandwidth.classic(s.capacity, refill);
            return Bucket.builder().addLimit(bw).build();
        }
    }

    @Component
    @Order(11)
    public static class TtsStartRateLimitFilter implements Filter {
        private final RateLimitProperties props;
        private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

        public TtsStartRateLimitFilter(RateLimitProperties props) { this.props = props; }

        @Override public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
                throws IOException, ServletException {
            var r = (HttpServletRequest) req;
            var w = (HttpServletResponse) res;

            if (!props.ttsStart.enabled || !r.getRequestURI().matches("^/documents/\\d+/audio/start$")) {
                chain.doFilter(req, res); return;
            }

            String userKey = (r.getUserPrincipal() != null)
                    ? r.getUserPrincipal().getName()
                    : "ip:" + req.getRemoteAddr();

            Bucket b = buckets.computeIfAbsent(userKey, k -> newBucket(props.ttsStart));
            if (b.tryConsume(1)) {
                chain.doFilter(req, res);
            } else {
                w.setStatus(429);
                w.getWriter().write("{\"error\":\"Too many starts, slow down\"}");
            }
        }

        private Bucket newBucket(RateLimitProperties.Section s) {
            var refill = Refill.greedy(s.refillTokens, Duration.ofSeconds(s.refillSeconds));
            var bw = Bandwidth.classic(s.capacity, refill);
            return Bucket.builder().addLimit(bw).build();
        }
    }
}
