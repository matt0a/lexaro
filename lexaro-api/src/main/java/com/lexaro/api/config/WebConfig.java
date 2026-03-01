package com.lexaro.api.config;

import com.lexaro.api.web.interceptor.UserMdcInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Spring MVC configuration that registers application-level interceptors.
 *
 * <p>Currently registers {@link UserMdcInterceptor}, which adds the authenticated userId
 * to the SLF4J MDC after Spring Security has processed the request. The interceptor is
 * applied to all paths ({@code /**}) because the interceptor itself checks for the presence
 * of an authenticated principal and is a no-op for unauthenticated requests.
 *
 * <p>CORS is configured separately in {@link CorsConfig} via the Security filter chain
 * ({@code corsConfigurationSource} bean) rather than here, so no {@code addCorsMappings}
 * override is needed.
 */
@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    /** Interceptor that writes the authenticated userId to MDC after authentication. */
    private final UserMdcInterceptor userMdcInterceptor;

    /**
     * Registers {@link UserMdcInterceptor} for all request paths.
     *
     * @param registry the interceptor registry provided by Spring MVC
     */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(userMdcInterceptor);
    }
}
