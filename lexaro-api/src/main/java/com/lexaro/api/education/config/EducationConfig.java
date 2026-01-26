package com.lexaro.api.education.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties({EducationProperties.class, AiProviderProperties.class})
public class EducationConfig {
}
