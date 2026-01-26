package com.lexaro.api.education.service.impl;

import com.lexaro.api.domain.User;
import com.lexaro.api.repo.UserRepository;
import com.lexaro.api.education.service.EducationUserContextService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
@RequiredArgsConstructor
public class EducationUserContextServiceImpl implements EducationUserContextService {

    private final UserRepository userRepository;

    @Override
    public User requireCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getName() == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "Unauthorized");
        }

        String email = auth.getName(); // your JWT typically sets this to email
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "User not found"));
    }
}
