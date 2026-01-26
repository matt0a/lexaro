package com.lexaro.api.education.service;

import com.lexaro.api.education.repo.dto.*;

import java.util.List;

public interface EducationProgressService {
    EducationAttemptEventDto recordAttempt(EducationAttemptCreateRequest req);
    EducationProgressSummaryDto getSummary();
    List<EducationAttemptEventDto> getAttempts(int days, int limit);
    List<EducationWeakTopicDto> getWeakTopics(int days, int limit);
}
