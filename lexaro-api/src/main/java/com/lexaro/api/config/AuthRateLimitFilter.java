package com.lexaro.api.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Order(10)
public class AuthRateLimitFilter implements Filter {
    private final RateLimitProperties props;
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    public AuthRateLimitFilter(RateLimitProperties props) { this.props = props; }

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest r = (HttpServletRequest) req;
        HttpServletResponse w = (HttpServletResponse) res;

        if (!props.auth.enabled || !r.getRequestURI().startsWith("/auth/")) {
            chain.doFilter(req, res); return;
        }

        String ip = req.getRemoteAddr();
        Bucket b = buckets.computeIfAbsent(ip, k -> newBucket(props.auth));
        if (b.tryConsume(1)) {
            chain.doFilter(req, res);
        } else {
            w.setStatus(429);
            w.setContentType("application/json");
            w.getWriter().write("{\"error\":\"Too many requests\"}");
        }
    }

    private Bucket newBucket(RateLimitProperties.Section s) {
        var refill = Refill.greedy(s.refillTokens, Duration.ofSeconds(s.refillSeconds));
        var bw = Bandwidth.classic(s.capacity, refill);
        return Bucket.builder().addLimit(bw).build();
    }
}
