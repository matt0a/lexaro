package com.lexaro.api.service;

import com.lexaro.api.domain.Plan;
import com.lexaro.api.domain.User;
import com.lexaro.api.repo.UserRepository;
import com.lexaro.api.security.JwtService;
import com.lexaro.api.web.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    // ----- Config flags -----
    @Value("${app.auth.requireEmailVerification:true}")
    private boolean requireVerification;

    @Value("${app.auth.verification.baseUrl:http://localhost:8080/auth/verify}")
    private String verificationBaseUrl;

    @Value("${app.auth.verification.ttlHours:48}")
    private long verificationTtlHours;

    // dev override: emails that always get “premium/unlimited” in your env
    @Value("${app.dev.adminEmails:}")
    private String adminEmailsCsv;

    private boolean isAdminEmail(String email) {
        if (adminEmailsCsv == null || adminEmailsCsv.isBlank()) return false;
        return Arrays.stream(adminEmailsCsv.split(","))
                .map(String::trim)
                .anyMatch(s -> s.equalsIgnoreCase(email));
    }

    private boolean applyAdminOverrides(User u) {
        boolean changed = false;
        if (isAdminEmail(u.getEmail())) {
            if (u.getPlan() != Plan.PREMIUM) { u.setPlan(Plan.PREMIUM); changed = true; }
            if (u.getRetentionDays() < 36500) { u.setRetentionDays(36500); changed = true; }
        }
        return changed;
    }

    private void generateAndSendVerification(User u) {
        u.setVerificationToken(UUID.randomUUID().toString());
        u.setVerificationSentAt(Instant.now());
        users.save(u);

        String link = verificationBaseUrl + "?token=" + u.getVerificationToken();
        // No mailer wired yet, so log the link for now:
        log.info("📧 Verification link for {}: {}", u.getEmail(), link);
    }

    private boolean tokenExpired(User u) {
        if (u.getVerificationSentAt() == null) return true;
        return Instant.now().isAfter(u.getVerificationSentAt().plus(Duration.ofHours(verificationTtlHours)));
    }

    // ---------------- API ----------------

    @Transactional
    public AuthResponse register(RegisterRequest r) {
        users.findByEmail(r.email()).ifPresent(u -> {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        });

        var user = User.builder()
                .email(r.email())
                .passwordHash(encoder.encode(r.password()))
                .plan(Plan.FREE)
                .retentionDays(0)
                .createdAt(Instant.now())
                .verified(false)
                .build();

        // Admin/dev convenience
        if (applyAdminOverrides(user)) {
            // You can auto-verify admins to simplify your local dev:
            user.setVerified(true);
            user.setVerifiedAt(Instant.now());
        }

        user = users.save(user);

        // Require verification for non-admins (or when flag is on)
        if (requireVerification && !user.isVerified()) {
            generateAndSendVerification(user);
            // Do NOT issue a JWT yet
            return new AuthResponse(user.getId(), user.getEmail(), null, user.getPlan().name());
        }

        // Otherwise log them straight in
        var token = jwt.generate(user.getId(), user.getEmail());
        return new AuthResponse(user.getId(), user.getEmail(), token, user.getPlan().name());
    }

    @Transactional
    public AuthResponse login(LoginRequest r) {
        var user = users.findByEmail(r.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        if (!encoder.matches(r.password(), user.getPasswordHash()))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");

        if (applyAdminOverrides(user)) {
            users.save(user);
        }

        if (requireVerification && !user.isVerified()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Email not verified. Check your inbox for the verification link.");
        }

        var token = jwt.generate(user.getId(), user.getEmail());
        return new AuthResponse(user.getId(), user.getEmail(), token, user.getPlan().name());
    }

    @Transactional
    public AuthResponse verifyByToken(String token) {
        var u = users.findByVerificationToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid verification token"));

        if (u.isVerified()) {
            // already verified — just sign a token
            var t = jwt.generate(u.getId(), u.getEmail());
            return new AuthResponse(u.getId(), u.getEmail(), t, u.getPlan().name());
        }

        if (tokenExpired(u)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Verification link expired. Please resend.");
        }

        u.setVerified(true);
        u.setVerifiedAt(Instant.now());
        u.setVerificationToken(null);
        users.save(u);

        var tokenJwt = jwt.generate(u.getId(), u.getEmail());
        return new AuthResponse(u.getId(), u.getEmail(), tokenJwt, u.getPlan().name());
    }

    @Transactional
    public void resendVerification(String email) {
        var u = users.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No account for that email"));
        if (u.isVerified()) return;

        if (u.getVerificationToken() == null || tokenExpired(u)) {
            generateAndSendVerification(u);
        } else {
            // still valid: just re-log the same link to avoid token spam
            String link = verificationBaseUrl + "?token=" + u.getVerificationToken();
            log.info("📧 (Resend) Verification link for {}: {}", u.getEmail(), link);
            u.setVerificationSentAt(Instant.now());
            users.save(u);
        }
    }
}
