package com.lexaro.api.web;

import com.lexaro.api.repo.UserRepository;
import com.lexaro.api.service.AuthService;
import com.lexaro.api.web.dto.AuthResponse;
import com.lexaro.api.web.dto.LoginRequest;
import com.lexaro.api.web.dto.RegisterRequest;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService auth;
    private final UserRepository users;

    public record ResendVerificationRequest(String email) {}

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest r) {
        return auth.register(r);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest r) {
        return auth.login(r);
    }

    @GetMapping("/verify")
    public AuthResponse verify(@RequestParam("token") String token) {
        if (token == null || token.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing token");
        }
        return auth.verifyByToken(token);
    }

    @PostMapping("/verify/resend")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resend(@RequestBody ResendVerificationRequest body) {
        if (body == null || body.email() == null || body.email().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email required");
        }
        auth.resendVerification(body.email());
    }

    @GetMapping("/me")
    public AuthResponse me() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        Long userId = (Long) a.getPrincipal();
        var u = users.findById(userId).orElseThrow();
        return new AuthResponse(u.getId(), u.getEmail(), null, u.getPlan().name());
    }

    // change password for logged-in user -----
    @PostMapping("/change-password")
    public AuthResponse changePassword(@RequestBody ChangePasswordReq req) {
        if (req.currentPassword == null || req.currentPassword.isBlank()
                || req.newPassword == null || req.newPassword.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Both Current Password and New Password are required");
        }
        // delegates to service, which hashes it
        return auth.changePassword(req.currentPassword, req.newPassword);
    }

    @Data
    public static class ChangePasswordReq {
        private String currentPassword;
        private String newPassword;
    }
}
