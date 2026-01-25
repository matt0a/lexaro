package com.lexaro.api.service;

import com.lexaro.api.config.StripeConfig;
import com.lexaro.api.domain.Plan;
import com.lexaro.api.domain.User;
import com.lexaro.api.repo.UserRepository;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BillingService {

    private final StripeConfig stripeConfig;
    private final UserRepository userRepository;

    @Value("${app.url}")
    private String appUrl;

    public Session createCheckoutSession(Long userId, String plan) throws StripeException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String normalized = (plan == null ? "FREE" : plan.trim().toUpperCase());

        if ("FREE".equals(normalized)) {
            throw new IllegalArgumentException("FREE plan does not require checkout");
        }

        // Map frontend plan key -> (Stripe priceId, backend Plan enum)
        PlanSelection sel = selectPlan(normalized);

        boolean eligibleForTrial = isTrialEligible(user);

        String successUrl = appUrl + "/dashboard?checkout=success";
        String cancelUrl  = appUrl + "/signup?checkout=cancel";

        SessionCreateParams.SubscriptionData.Builder subData =
                SessionCreateParams.SubscriptionData.builder();

        // 3-day trial only if eligible
        if (eligibleForTrial) {
            subData.setTrialPeriodDays(3L);
        }

        // Put metadata on BOTH subscription + session (makes webhook handling reliable)
        subData.putMetadata("userId", String.valueOf(userId));
        subData.putMetadata("plan", normalized);
        subData.putMetadata("trialGranted", String.valueOf(eligibleForTrial));

        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
                .setCustomerEmail(user.getEmail())
                .addLineItem(
                        SessionCreateParams.LineItem.builder()
                                .setPrice(sel.priceId())
                                .setQuantity(1L)
                                .build()
                )
                .setSubscriptionData(subData.build())
                .setSuccessUrl(successUrl)
                .setCancelUrl(cancelUrl)
                .putMetadata("userId", String.valueOf(userId))
                .putMetadata("plan", normalized)
                .putMetadata("trialGranted", String.valueOf(eligibleForTrial))
                .build();

        return Session.create(params);
    }

    public Event verifyAndConstructEvent(String payload, String sigHeader) throws Exception {
        return Webhook.constructEvent(payload, sigHeader, stripeConfig.getWebhookSecret());
    }

    public void handleCheckoutCompleted(Session session) {
        Map<String, String> meta = session.getMetadata();
        if (meta == null) return;

        String userIdStr = meta.get("userId");
        String planKey = meta.get("plan");
        String trialGrantedStr = meta.get("trialGranted");

        if (userIdStr == null || planKey == null) return;

        Long userId;
        try {
            userId = Long.valueOf(userIdStr);
        } catch (Exception e) {
            return;
        }

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return;

        // Save Stripe IDs (safe even if null)
        user.setStripeCustomerId(session.getCustomer());
        user.setStripeSubscriptionId(session.getSubscription());

        // ✅ FIX: plan is an enum, not a String
        Plan mappedPlan = mapPlanKeyToEnum(planKey);
        user.setPlan(mappedPlan);

        // ✅ Trial enforcement: only mark if trial was actually granted at checkout
        boolean trialGranted = "true".equalsIgnoreCase(trialGrantedStr);
        if (trialGranted) {
            if (user.getTrialUsedAt() == null) {
                user.setTrialUsedAt(Instant.now());
            }
            if (user.getTrialCooldownUntil() == null || user.getTrialCooldownUntil().isBefore(Instant.now())) {
                user.setTrialCooldownUntil(Instant.now().plus(6, ChronoUnit.MONTHS));
            }
        }

        userRepository.save(user);
    }

    private boolean isTrialEligible(User user) {
        Instant now = Instant.now();

        // If you’re using a hard cooldown timestamp, this is the strongest check:
        if (user.getTrialCooldownUntil() != null && user.getTrialCooldownUntil().isAfter(now)) {
            return false;
        }

        // Fallback: allow if never used, or used more than 6 months ago
        if (user.getTrialUsedAt() == null) return true;

        Instant sixMonthsAgo = now.minus(6, ChronoUnit.MONTHS);
        return user.getTrialUsedAt().isBefore(sixMonthsAgo);
    }

    // ---- helpers ----

    private PlanSelection selectPlan(String normalized) {
        return switch (normalized) {
            // Monthly
            case "PREMIUM" -> new PlanSelection(stripeConfig.getPrice().getPremium(), Plan.PREMIUM);
            case "PREMIUM_PLUS" -> new PlanSelection(stripeConfig.getPrice().getPremiumPlus(), Plan.BUSINESS);

            // Yearly (your new ones)
            case "PREMIUM_YEARLY", "PREMIUM_ANNUAL" ->
                    new PlanSelection(stripeConfig.getPrice().getPremiumYearly(), Plan.PREMIUM);

            case "PREMIUM_PLUS_YEARLY", "PREMIUM_PLUS_ANNUAL" ->
                    new PlanSelection(stripeConfig.getPrice().getPremiumPlusYearly(), Plan.BUSINESS);

            default -> throw new IllegalArgumentException("Unknown plan: " + normalized);
        };
    }

    /**
     * Converts the plan key saved in Stripe metadata into your backend enum.
     * NOTE: You currently have Plan.FREE, PREMIUM, BUSINESS, BUSINESS_PLUS.
     * This maps PREMIUM_PLUS -> BUSINESS so your existing enum works without changing it.
     */
    private Plan mapPlanKeyToEnum(String planKey) {
        if (planKey == null) return Plan.FREE;

        String p = planKey.trim().toUpperCase();

        // Yearly keys should map to the same plan tier
        if (p.endsWith("_YEARLY") || p.endsWith("_ANNUAL")) {
            p = p.replace("_YEARLY", "").replace("_ANNUAL", "");
        }

        return switch (p) {
            case "PREMIUM" -> Plan.PREMIUM;
            case "PREMIUM_PLUS" -> Plan.BUSINESS; // maps to your current enum
            default -> throw new IllegalArgumentException("Unknown plan: " + planKey);
        };
    }

    private record PlanSelection(String priceId, Plan plan) {}
}
