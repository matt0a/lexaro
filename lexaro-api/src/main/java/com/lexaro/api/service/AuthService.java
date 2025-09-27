package com.lexaro.api.service;

import com.lexaro.api.domain.Plan;
import com.lexaro.api.domain.User;
import com.lexaro.api.mail.MailService;
import com.lexaro.api.repo.UserRepository;
import com.lexaro.api.security.JwtService;
import com.lexaro.api.web.dto.AuthResponse;
import com.lexaro.api.web.dto.LoginRequest;
import com.lexaro.api.web.dto.RegisterRequest;
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
    private final MailService mail; // <-- send real emails

    // --- Config ---
    @Value("${app.auth.requireEmailVerification:true}")
    private boolean requireVerification;

    @Value("${app.auth.verification.baseUrl:http://localhost:8080/auth/verify}")
    private String verificationBaseUrl;

    @Value("${app.auth.verification.ttlHours:48}")
    private long verificationTtlHours;

    @Value("${app.auth.verification.resendCooldownSeconds:60}")
    private long resendCooldownSeconds;

    @Value("${app.dev.adminEmails:}")
    private String adminEmailsCsv;

    // --- Helpers ---

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

    private void sendVerificationEmail(User u, String link) {
        String subject = "Verify your email for Lexaro";
        String text = """
                Hi,
                
                Please verify your email by clicking the link below:
                %s
                
                This link expires in %d hours.
                
                If you didn't request this, you can ignore it.
                """.formatted(link, verificationTtlHours);

        String html = """
                <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif">
                  <h2>Verify your email</h2>
                  <p>Click the button below to verify your Lexaro account.</p>
                  <p><a href="%s" style="display:inline-block;padding:10px 16px;border-radius:6px;background:#111;color:#fff;text-decoration:none">Verify email</a></p>
                  <p style="color:#666;font-size:12px">This link expires in %d hours.</p>
                </div>
                """.formatted(link, verificationTtlHours);

        try {
            mail.send(u.getEmail(), subject, text, html);
        } catch (Exception ex) {
            // Don't block signup on mail flakiness — just log
            log.error("Failed to send verification email to {}: {}", u.getEmail(), ex.toString(), ex);
        }
        log.info("📧 Verification link (debug) for {}: {}", u.getEmail(), link);
    }

    private void generateAndSendVerification(User u) {
        u.setVerificationToken(UUID.randomUUID().toString());
        u.setVerificationSentAt(Instant.now());
        users.save(u);
        String link = verificationBaseUrl + "?token=" + u.getVerificationToken();
        sendVerificationEmail(u, link);
    }

    private boolean tokenExpired(User u) {
        if (u.getVerificationSentAt() == null) return true;
        return Instant.now().isAfter(u.getVerificationSentAt()
                .plus(Duration.ofHours(verificationTtlHours)));
    }

    private void ensureNotInResendCooldown(User u) {
        if (u.getVerificationSentAt() == null) return;
        long seconds = Duration.between(u.getVerificationSentAt(), Instant.now()).getSeconds();
        long remaining = resendCooldownSeconds - seconds;
        if (remaining > 0) {
            throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Please wait " + remaining + "s before requesting another verification email."
            );
        }
    }

    // --- API ---

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
            user.setVerified(true);
            user.setVerifiedAt(Instant.now());
        }

        user = users.save(user);

        // Require verification for non-admins
        if (requireVerification && !user.isVerified()) {
            generateAndSendVerification(user);
            return new AuthResponse(user.getId(), user.getEmail(), null, user.getPlan().name());
        }

        // Otherwise log straight in
        var token = jwt.generate(user.getId(), user.getEmail());
        return new AuthResponse(user.getId(), user.getEmail(), token, user.getPlan().name());
    }

    @Transactional
    public AuthResponse login(LoginRequest r) {
        var user = users.findByEmail(r.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!encoder.matches(r.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        if (applyAdminOverrides(user)) {
            users.save(user);
        }

        if (requireVerification && !user.isVerified()) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Email not verified. Check your inbox for the verification link."
            );
        }

        var token = jwt.generate(user.getId(), user.getEmail());
        return new AuthResponse(user.getId(), user.getEmail(), token, user.getPlan().name());
    }

    @Transactional
    public AuthResponse verifyByToken(String token) {
        var u = users.findByVerificationToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid verification token"));

        if (u.isVerified()) {
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

        ensureNotInResendCooldown(u);

        if (u.getVerificationToken() == null || tokenExpired(u)) {
            generateAndSendVerification(u);
        } else {
            String link = verificationBaseUrl + "?token=" + u.getVerificationToken();
            sendVerificationEmail(u, link); // reuse existing token while valid
            u.setVerificationSentAt(Instant.now());
            users.save(u);
        }
    }
}
