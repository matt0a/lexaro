package com.lexaro.api.service;

import com.lexaro.api.domain.Plan;
import com.lexaro.api.domain.User;
import com.lexaro.api.repo.UserRepository;
import com.lexaro.api.security.JwtService;
import com.lexaro.api.web.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Arrays;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    // dev override: emails that always get unlimited premium
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
            // effectively “unlimited” retention for you in dev
            if (u.getRetentionDays() < 36500) { u.setRetentionDays(36500); changed = true; }
        }
        return changed;
    }

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
                .build();

        // auto-upgrade if this is your admin/dev email
        if (applyAdminOverrides(user)) {
            // nothing else; fields already set
        }
        user = users.save(user);

        var token = jwt.generate(user.getId(), user.getEmail());
        return new AuthResponse(user.getId(), user.getEmail(), token, user.getPlan().name());
    }

    @Transactional
    public AuthResponse login(LoginRequest r) {
        var user = users.findByEmail(r.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        if (!encoder.matches(r.password(), user.getPasswordHash()))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");

        // if you added your email to admin list later, upgrade on login
        if (applyAdminOverrides(user)) {
            users.save(user);
        }

        var token = jwt.generate(user.getId(), user.getEmail());
        return new AuthResponse(user.getId(), user.getEmail(), token, user.getPlan().name());
    }
}
