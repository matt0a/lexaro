package com.lexaro.api.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record LoginRequest(@Email String email, @Size(min=8) String password) {}
