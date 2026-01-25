package com.lexaro.api.config;

import com.stripe.Stripe;
import jakarta.annotation.PostConstruct;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "stripe")
public class StripeConfig {

    private String secretKey;
    private String webhookSecret;

    /**
     * Trial length in days (test now, prod later just swap env/props).
     */
    private long trialDays = 3;

    private final Price price = new Price();

    @Data
    public static class Price {
        private String premium;
        private String premiumPlus;

        private String premiumYearly;
        private String premiumPlusYearly;
    }

    @PostConstruct
    public void init() {
        if (secretKey != null && !secretKey.isBlank()) {
            Stripe.apiKey = secretKey;
        }
    }
}
