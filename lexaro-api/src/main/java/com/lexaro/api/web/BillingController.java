package com.lexaro.api.web;

import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/billing")
public class BillingController {

    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(@RequestBody CheckoutReq req) {
        return ResponseEntity.ok(Map.of(
                "sessionId", "mock_" + UUID.randomUUID(),
                "amount",    req.amountCents,
                "currency",  (req.currency == null ? "usd" : req.currency)
        ));
    }

    @PostMapping("/webhook")
    public ResponseEntity<?> webhook(@RequestBody String raw) {
        // TODO: Stripe signature verification later
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @Data
    public static class CheckoutReq {
        public Long amountCents;
        public String currency;
        public String description;
    }
}
