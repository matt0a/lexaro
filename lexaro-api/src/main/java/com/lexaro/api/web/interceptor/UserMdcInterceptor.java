package com.lexaro.api.web.interceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Spring MVC interceptor that adds the authenticated userId to the SLF4J MDC.
 *
 * <p>This runs AFTER the Spring Security filter chain has authenticated the request,
 * meaning the SecurityContext principal (set by {@link com.lexaro.api.security.JwtAuthFilter})
 * is available when {@link #preHandle} executes. Using a {@link HandlerInterceptor} rather
 * than a Servlet filter guarantees the correct ordering relative to authentication.
 *
 * <p>The principal stored in the SecurityContext is a {@link Long} (the userId) set by
 * {@code JwtAuthFilter} via {@code UsernamePasswordAuthenticationToken(userId, ...)}.
 *
 * <p>The MDC key {@code userId} is removed in {@link #afterCompletion} so pooled threads
 * do not carry a stale userId into the next request. Note that
 * {@link com.lexaro.api.web.filter.RequestCorrelationFilter} already calls {@code MDC.clear()}
 * in its finally block; the removal here is a belt-and-suspenders guard for the MVC layer.
 */
@Component
public class UserMdcInterceptor implements HandlerInterceptor {

    /** MDC key written with the authenticated user's database ID. */
    private static final String MDC_USER_ID = "userId";

    /**
     * Writes the authenticated userId to the MDC before the handler method executes.
     *
     * @param request  current HTTP request
     * @param response current HTTP response
     * @param handler  the chosen handler (controller method)
     * @return {@code true} always — never short-circuits the handler chain
     */
    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        // The principal is a Long (userId) set by JwtAuthFilter; use pattern variable to guard.
        if (auth != null && auth.getPrincipal() instanceof Long userId) {
            MDC.put(MDC_USER_ID, userId.toString());
        }
        return true;
    }

    /**
     * Removes the userId from the MDC after the handler completes (including on exception).
     *
     * @param request  current HTTP request
     * @param response current HTTP response
     * @param handler  the handler that was executed
     * @param ex       any exception thrown by the handler, or {@code null}
     */
    @Override
    public void afterCompletion(HttpServletRequest request,
                                HttpServletResponse response,
                                Object handler,
                                Exception ex) {
        MDC.remove(MDC_USER_ID);
    }
}
