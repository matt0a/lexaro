package com.lexaro.api.education.web;

import com.lexaro.api.education.repo.dto.*;
import com.lexaro.api.education.service.EducationProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/education")
public class EducationProgressController {

    private final EducationProgressService progressService;

    @PostMapping("/attempts")
    public EducationAttemptEventDto recordAttempt(@RequestBody EducationAttemptCreateRequest req) {
        return progressService.recordAttempt(req);
    }

    @GetMapping("/progress/summary")
    public EducationProgressSummaryDto summary() {
        return progressService.getSummary();
    }

    @GetMapping("/progress/attempts")
    public List<EducationAttemptEventDto> attempts(
            @RequestParam(defaultValue = "30") int days,
            @RequestParam(defaultValue = "100") int limit
    ) {
        return progressService.getAttempts(days, limit);
    }

    @GetMapping("/progress/weak-topics")
    public List<EducationWeakTopicDto> weakTopics(
            @RequestParam(defaultValue = "30") int days,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return progressService.getWeakTopics(days, limit);
    }
}
