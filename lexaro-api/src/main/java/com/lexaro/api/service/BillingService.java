package com.lexaro.api.service;

import com.lexaro.api.config.StripeConfig;
import com.lexaro.api.domain.Plan;
import com.lexaro.api.domain.User;
import com.lexaro.api.repo.UserRepository;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.Subscription;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.SubscriptionRetrieveParams;
import com.stripe.param.checkout.SessionCreateParams;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class BillingService {

    private final StripeConfig stripeConfig;
    private final UserRepository userRepository;

    @Value("${app.url:http://localhost:3000}")
    private String appUrl;

    /**
     * IMPORTANT:
     * This must point to the page that runs the "checkout success -> /billing/sync" logic.
     * If your UI page is /upgrade instead of /billing, change this constant to "/upgrade".
     */
    private static final String BILLING_RETURN_PATH = "/billing";

    public Session createCheckoutSession(Long userId, String planKey) throws StripeException {
        User user = userRepository.findById(userId).orElseThrow();

        String priceId = resolvePriceId(planKey);

        // ✅ Return to billing page so frontend can call /billing/sync using session_id
        String successUrl = appUrl + BILLING_RETURN_PATH + "?checkout=success&session_id={CHECKOUT_SESSION_ID}";
        String cancelUrl = appUrl + BILLING_RETURN_PATH + "?checkout=cancel";

        SessionCreateParams.Builder builder = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
                .setSuccessUrl(successUrl)
                .setCancelUrl(cancelUrl)
                .setClientReferenceId(String.valueOf(userId))
                .addLineItem(SessionCreateParams.LineItem.builder()
                        .setPrice(priceId)
                        .setQuantity(1L)
                        .build())
                .setSubscriptionData(SessionCreateParams.SubscriptionData.builder()
                        .setTrialPeriodDays(stripeConfig.getTrialDays())
                        .putMetadata("userId", String.valueOf(userId))
                        .putMetadata("planKey", planKey)
                        .build());

        // Reuse existing Stripe customer if we have one
        if (user.getStripeCustomerId() != null && !user.getStripeCustomerId().isBlank()) {
            builder.setCustomer(user.getStripeCustomerId());
        } else if (user.getEmail() != null && !user.getEmail().isBlank()) {
            builder.setCustomerEmail(user.getEmail());
        }

        return Session.create(builder.build());
    }

    public Event verifyAndConstructEvent(String payload, String signature) throws StripeException {
        return Webhook.constructEvent(payload, signature, stripeConfig.getWebhookSecret());
    }

    public void handleCheckoutCompleted(Session session) throws StripeException {
        if (session.getSubscription() == null) return;
        handleSubscriptionEvent(session.getSubscription());
    }

    public void handleSubscriptionEvent(String subscriptionId) throws StripeException {
        Subscription sub = Subscription.retrieve(
                subscriptionId,
                SubscriptionRetrieveParams.builder()
                        .addExpand("items.data.price")
                        .build(),
                null
        );

        Map<String, String> md = sub.getMetadata();
        Long userId = null;

        if (md != null && md.get("userId") != null) {
            try { userId = Long.valueOf(md.get("userId")); }
            catch (NumberFormatException ignored) {}
        }

        User user = null;

        if (userId != null) user = userRepository.findById(userId).orElse(null);
        if (user == null && sub.getCustomer() != null) user = userRepository.findByStripeCustomerId(sub.getCustomer()).orElse(null);
        if (user == null) user = userRepository.findByStripeSubscriptionId(subscriptionId).orElse(null);
        if (user == null) return;

        String planKey = md != null ? md.get("planKey") : null;

        user.setPlan(mapPlanKeyToPlan(planKey));
        user.setStripeCustomerId(sub.getCustomer());
        user.setStripeSubscriptionId(sub.getId());
        user.setStripeSubscriptionStatus(sub.getStatus());
        userRepository.save(user);
    }

    public void syncFromCheckoutSession(String sessionId, Long userId) throws StripeException {
        Session session = Session.retrieve(sessionId);

        // Safety: make sure this session belongs to this user (client_reference_id)
        String clientRef = session.getClientReferenceId();
        if (clientRef != null && !clientRef.isBlank()) {
            try {
                long ref = Long.parseLong(clientRef);
                if (ref != userId) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Session does not belong to authenticated user");
                }
            } catch (NumberFormatException ignored) {}
        }

        if (session.getSubscription() == null) return;

        // Link customer/subscription to user
        User user = userRepository.findById(userId).orElseThrow();
        if (session.getCustomer() != null) user.setStripeCustomerId(session.getCustomer());
        if (session.getSubscription() != null) user.setStripeSubscriptionId(session.getSubscription());
        userRepository.save(user);

        // Pull latest subscription -> updates plan + status
        handleSubscriptionEvent(session.getSubscription());
    }

    /**
     * ✅ Stripe Billing Portal (manage / cancel / update payment method)
     */
    public com.stripe.model.billingportal.Session createPortalSession(Long userId) throws StripeException {
        User user = userRepository.findById(userId).orElseThrow();

        if (user.getStripeCustomerId() == null || user.getStripeCustomerId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No Stripe customer found for this account");
        }

        // ✅ MUST use billingportal SessionCreateParams (not checkout SessionCreateParams)
        com.stripe.param.billingportal.SessionCreateParams portalParams =
                com.stripe.param.billingportal.SessionCreateParams.builder()
                        .setCustomer(user.getStripeCustomerId())
                        .setReturnUrl(appUrl + "/dashboard")
                        .build();

        return com.stripe.model.billingportal.Session.create(portalParams);
    }

    private String resolvePriceId(String planKey) {
        return switch (planKey) {
            case "PREMIUM" -> stripeConfig.getPrice().getPremium();
            case "PREMIUM_PLUS" -> stripeConfig.getPrice().getPremiumPlus();
            case "PREMIUM_YEARLY" -> stripeConfig.getPrice().getPremiumYearly();
            case "PREMIUM_PLUS_YEARLY" -> stripeConfig.getPrice().getPremiumPlusYearly();
            default -> throw new IllegalArgumentException("Unknown plan: " + planKey);
        };
    }

    private Plan mapPlanKeyToPlan(String planKey) {
        if (planKey == null) return Plan.FREE;
        return switch (planKey) {
            case "PREMIUM", "PREMIUM_YEARLY" -> Plan.PREMIUM;
            case "PREMIUM_PLUS", "PREMIUM_PLUS_YEARLY" -> Plan.BUSINESS_PLUS;
            default -> Plan.FREE;
        };
    }
}
