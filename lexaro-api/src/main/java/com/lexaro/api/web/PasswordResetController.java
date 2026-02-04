package com.lexaro.api.web;

import com.lexaro.api.domain.User;
import com.lexaro.api.mail.MailService;
import com.lexaro.api.mail.templates.PasswordResetEmailTemplate;
import com.lexaro.api.repo.PasswordResetTokenRepository;
import com.lexaro.api.repo.UserRepository;
import com.lexaro.api.security.PasswordResetToken;
import jakarta.transaction.Transactional;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/auth")
public class PasswordResetController {

    private final UserRepository users;
    private final PasswordResetTokenRepository tokens;
    private final MailService mail;
    private final PasswordEncoder encoder;
    private final String brandName;

    public PasswordResetController(
            UserRepository users,
            PasswordResetTokenRepository tokens,
            MailService mail,
            PasswordEncoder encoder,
            @Value("${app.mail.brand-name:Lexaro}") String brandName) {
        this.users = users;
        this.tokens = tokens;
        this.mail = mail;
        this.encoder = encoder;
        this.brandName = brandName;
    }

    @PostMapping("/forgot")
    @Transactional
    public ResponseEntity<?> forgot(@RequestBody ForgotReq req) {
        User u = users.findByEmail(req.email).orElse(null);
        if (u != null) {
            PasswordResetToken t = new PasswordResetToken();
            t.setUserId(u.getId());
            t.setToken(UUID.randomUUID().toString().replace("-", ""));
            t.setExpiresAt(Instant.now().plus(30, ChronoUnit.MINUTES));
            tokens.save(t);

            String link = (req.baseUrl == null || req.baseUrl.isBlank()
                    ? "http://localhost:3000" : req.baseUrl) + "/reset?token=" + t.getToken();

            // Compute expiry minutes (clamp to minimum 1 in case of clock drift)
            long expiresMinutes = Math.max(1, ChronoUnit.MINUTES.between(Instant.now(), t.getExpiresAt()));

            String subject = PasswordResetEmailTemplate.subject(brandName);
            String text = PasswordResetEmailTemplate.textBody(brandName, link, expiresMinutes);
            String html = PasswordResetEmailTemplate.htmlBody(brandName, link, expiresMinutes);

            try {
                mail.send(u.getEmail(), subject, text, html);
                log.info("Password reset email sent for userId={}", u.getId());
            } catch (Exception ex) {
                log.error("Failed to send password reset email for userId={}: {}", u.getId(), ex.getMessage());
            }
        }
        // Always 200 to avoid email enumeration
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PostMapping("/reset")
    @Transactional
    public ResponseEntity<?> reset(@RequestBody ResetReq req) {
        var opt = tokens.findByToken(req.token);
        if (opt.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error","Invalid token"));

        var t = opt.get();
        if (t.getUsedAt() != null || t.getExpiresAt().isBefore(Instant.now()))
            return ResponseEntity.badRequest().body(Map.of("error","Expired or used"));

        var u = users.findById(t.getUserId()).orElseThrow();

        // *** IMPORTANT: hash the new password ***
        u.setPasswordHash(encoder.encode(req.newPassword));
        users.save(u);

        t.setUsedAt(Instant.now());
        tokens.save(t);

        return ResponseEntity.ok(Map.of("ok", true));
    }

    @Data public static class ForgotReq { public String email; public String baseUrl; }
    @Data public static class ResetReq { public String token; public String newPassword; }
}
