package com.lexaro.api.web;

import com.lexaro.api.domain.User;
import com.lexaro.api.repo.UserRepository;
import com.lexaro.api.service.BillingService;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.Subscription;
import com.stripe.model.checkout.Session;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/billing")
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;
    private final UserRepository userRepository;

    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(
            @AuthenticationPrincipal Long userId,
            @RequestBody CheckoutReq req
    ) throws StripeException {

        Session session = billingService.createCheckoutSession(userId, req.plan);

        return ResponseEntity.ok(Map.of(
                "sessionId", session.getId(),
                "url", session.getUrl()
        ));
    }

    @PostMapping("/sync")
    public ResponseEntity<?> sync(
            @AuthenticationPrincipal Long userId,
            @RequestBody SyncReq req
    ) throws StripeException {
        billingService.syncFromCheckoutSession(req.sessionId, userId);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    /**
     * ✅ Stripe Billing Portal session (for paid users to cancel/change plan)
     */
    @PostMapping("/portal")
    public ResponseEntity<?> portal(@AuthenticationPrincipal Long userId) throws StripeException {
        var portal = billingService.createPortalSession(userId);
        return ResponseEntity.ok(Map.of("url", portal.getUrl()));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal Long userId) {
        User u = userRepository.findById(userId).orElseThrow();
        return ResponseEntity.ok(Map.of(
                "plan", u.getPlan(),
                "stripeCustomerId", u.getStripeCustomerId(),
                "stripeSubscriptionId", u.getStripeSubscriptionId(),
                "stripeSubscriptionStatus", u.getStripeSubscriptionStatus()
        ));
    }

    @PostMapping("/webhook")
    public ResponseEntity<?> webhook(
            @RequestBody String payload,
            @RequestHeader(name = "Stripe-Signature", required = false) String sig
    ) throws Exception {

        if (sig == null || sig.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing Stripe-Signature header"));
        }

        Event event = billingService.verifyAndConstructEvent(payload, sig);

        switch (event.getType()) {
            case "checkout.session.completed" -> {
                Session session = (Session) event.getDataObjectDeserializer()
                        .getObject()
                        .orElse(null);
                if (session != null) billingService.handleCheckoutCompleted(session);
            }
            case "customer.subscription.created",
                 "customer.subscription.updated",
                 "customer.subscription.deleted" -> {

                Subscription sub = (Subscription) event.getDataObjectDeserializer()
                        .getObject()
                        .orElse(null);

                if (sub != null) billingService.handleSubscriptionEvent(sub.getId());
            }
            default -> {
                // ignore
            }
        }

        return ResponseEntity.ok(Map.of("ok", true));
    }

    @Data
    public static class CheckoutReq {
        public String plan;
    }

    @Data
    public static class SyncReq {
        public String sessionId;
    }
}
