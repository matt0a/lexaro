package com.lexaro.api.web.dto;

public record AuthResponse(Long userId, String email, String token, String Plan) {
}
