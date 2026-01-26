package com.lexaro.api.education.service;

import com.lexaro.api.domain.User;

public interface EducationUserContextService {
    User requireCurrentUser();
}
