package com.lexaro.api.web.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

/**
 * Servlet filter that assigns a unique requestId to every incoming HTTP request.
 *
 * <p>The requestId is sourced from the {@code X-Request-Id} header (if provided by the client
 * or a load balancer) or generated as a random 8-character hex string derived from a UUID.
 * It is stored in the SLF4J MDC so it appears in every log line for this request, and echoed
 * back in the {@code X-Request-Id} response header for client-side correlation.
 *
 * <p>The {@code path} MDC key is also set so log lines include the request URI without
 * requiring the caller to repeat it.
 *
 * <p>MDC is cleared in the {@code finally} block to prevent leakage across pooled threads.
 *
 * <p>Note: userId is NOT added here because this filter runs before authentication.
 * userId is added post-authentication via {@link com.lexaro.api.web.interceptor.UserMdcInterceptor}.
 *
 * <p>Order is set to {@link Ordered#HIGHEST_PRECEDENCE} so the requestId is available in all
 * downstream filters including the security filter chain.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestCorrelationFilter extends OncePerRequestFilter {

    /** HTTP header used to pass or echo the request correlation identifier. */
    private static final String REQUEST_ID_HEADER = "X-Request-Id";

    /** MDC key for the per-request correlation ID. */
    private static final String MDC_REQUEST_ID = "requestId";

    /** MDC key for the request URI path. */
    private static final String MDC_PATH = "path";

    /**
     * Assigns a requestId and path to the MDC, writes the requestId as a response header,
     * then delegates to the rest of the filter chain. MDC is always cleared in the finally block.
     *
     * @param request     the incoming HTTP request
     * @param response    the outgoing HTTP response
     * @param filterChain the remaining filter chain
     * @throws ServletException if the chain throws a servlet error
     * @throws IOException      if the chain throws an I/O error
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // Use the client-supplied X-Request-Id if present and non-blank;
        // otherwise generate an 8-character hex identifier from a random UUID.
        String requestId = Optional.ofNullable(request.getHeader(REQUEST_ID_HEADER))
                .filter(s -> !s.isBlank())
                .orElseGet(() -> UUID.randomUUID().toString().replace("-", "").substring(0, 8));

        MDC.put(MDC_REQUEST_ID, requestId);
        MDC.put(MDC_PATH, request.getRequestURI());

        // Echo the requestId back so clients and load balancers can correlate logs.
        response.setHeader(REQUEST_ID_HEADER, requestId);

        try {
            filterChain.doFilter(request, response);
        } finally {
            // Always clear MDC to prevent thread-local leakage when threads are reused.
            MDC.clear();
        }
    }
}
