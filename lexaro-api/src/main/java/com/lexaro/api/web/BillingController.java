package com.lexaro.api.web;

import com.lexaro.api.service.BillingService;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.StripeObject;
import com.stripe.model.checkout.Session;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/billing")
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;

    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(@RequestBody CheckoutReq req) throws StripeException {

        // ✅ TEMP for testing (replace with JWT-derived user id)
        Long userId = 1L;

        Session session = billingService.createCheckoutSession(userId, req.plan);

        // ✅ Return ONLY url (your frontend redirects via url)
        return ResponseEntity.ok(Map.of("url", session.getUrl()));
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

        if ("checkout.session.completed".equals(event.getType())) {
            StripeObject obj = event.getDataObjectDeserializer().getObject().orElse(null);
            if (obj instanceof Session session) {
                billingService.handleCheckoutCompleted(session);
            }
        }

        return ResponseEntity.ok(Map.of("ok", true));
    }

    @Data
    public static class CheckoutReq {
        public String plan;
    }
}
