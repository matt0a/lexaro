package com.lexaro.api.web;

import com.lexaro.api.repo.UserRepository;
import com.lexaro.api.service.AuthService;
import com.lexaro.api.web.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService auth;
    private final UserRepository users;

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest r) { return auth.register(r); }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest r) { return auth.login(r); }

    @GetMapping("/me")
    public AuthResponse me() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        Long userId = (Long) a.getPrincipal();
        var u = users.findById(userId).orElseThrow();
        return new AuthResponse(u.getId(), u.getEmail(), null, u.getPlan().name());
    }
}
