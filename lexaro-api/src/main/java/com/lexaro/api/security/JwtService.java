package com.lexaro.api.security;

import com.lexaro.api.repo.UserRepository;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@Service
public class JwtService {

    @Value("${app.jwt.secret}") private String secret;
    @Value("${app.jwt.issuer}") private String issuer;
    @Value("${app.jwt.ttlMinutes}") private long ttlMinutes;

    // Emails that should be treated as unlimited (either list works)
    @Value("${app.dev.adminEmails:}") private String adminEmailsCsv;
    @Value("${app.unlimited-emails:}") private String unlimitedEmailsCsv;

    private final UserRepository users;

    public JwtService(UserRepository users) {
        this.users = users;
    }

    public String generate(Long userId, String email) {
        Instant now = Instant.now();

        // plan: read from DB if available; default to FREE if user not found (shouldn't happen)
        String plan = users.findById(userId)
                .map(u -> u.getPlan().name())
                .orElse("FREE");

        boolean unlimited = isEmailInList(adminEmailsCsv, email) || isEmailInList(unlimitedEmailsCsv, email);

        return Jwts.builder()
                .setIssuer(issuer)
                .setSubject(String.valueOf(userId))              // principal stays userId
                .claim("email", email)
                .claim("plan", plan)                             // "FREE" | "PREMIUM"
                .claim("unlimited", unlimited)                   // boolean
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plus(ttlMinutes, ChronoUnit.MINUTES)))
                .signWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)), SignatureAlgorithm.HS256)
                .compact();
    }

    public Jws<Claims> parse(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)))
                .build()
                .parseClaimsJws(token);
    }

    private static boolean isEmailInList(String csv, String email) {
        if (csv == null || csv.isBlank() || email == null || email.isBlank()) return false;
        String target = email.trim();
        for (String s : csv.split(",")) {
            if (target.equalsIgnoreCase(s.trim())) return true;
        }
        return false;
    }
}
