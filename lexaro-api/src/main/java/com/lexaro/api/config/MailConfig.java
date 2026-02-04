package com.lexaro.api.config;

import com.lexaro.api.mail.LogMailService;
import com.lexaro.api.mail.MailService;
import com.lexaro.api.mail.ResendMailService;
import com.lexaro.api.mail.SesMailService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MailConfig {

    @Value("${app.mail.from}")           private String from;
    @Value("${app.mail.fromName:}")      private String fromName;
    @Value("${app.mail.ses.region:us-east-2}") private String region;
    @Value("${app.mail.ses.accessKey:}") private String accessKey;
    @Value("${app.mail.ses.secretKey:}") private String secretKey;
    @Value("${resend.api.key:}")         private String resendApiKey;

    /** Use SES when app.mail.provider=ses */
    @Bean
    @ConditionalOnProperty(name = "app.mail.provider", havingValue = "ses")
    public MailService sesMailService() {
        return SesMailService.create(region, from, accessKey, secretKey);
    }

    /** Default/log fallback when app.mail.provider is absent or "log" */
    @Bean
    @ConditionalOnProperty(
            name = "app.mail.provider",
            havingValue = "log",
            matchIfMissing = true)
    public MailService logMailService() {
        return new LogMailService();
    }

    /** Use Resend when app.mail.provider=resend */
    @Bean
    @ConditionalOnProperty(name = "app.mail.provider", havingValue = "resend")
    public MailService resendMailService() {
        return ResendMailService.create(resendApiKey, from, fromName);
    }
}
