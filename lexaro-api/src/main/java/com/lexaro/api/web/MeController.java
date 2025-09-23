package com.lexaro.api.web;

import com.lexaro.api.repo.UserRepository;
import com.lexaro.api.service.PlanService;
import com.lexaro.api.service.TtsQuotaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/me")
@RequiredArgsConstructor
public class MeController {

    private final UserRepository users;
    private final PlanService plans;
    private final TtsQuotaService quota;

    private Long userId() {
        return (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    public record UsageDto(String plan, boolean unlimited, long monthlyCap, long used, long remaining) {}

    @GetMapping("/usage")
    public UsageDto usage() {
        var u = users.findById(userId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        var plan = plans.effectivePlan(u);
        boolean unlimited = plans.isUnlimited(u);
        long cap = unlimited ? Long.MAX_VALUE : plans.monthlyCapForPlan(plan);
        long used = unlimited ? 0L : quota.currentUsage(u.getId());
        long remaining = unlimited ? Long.MAX_VALUE : Math.max(0, cap - used);
        return new UsageDto(plan.name(), unlimited, cap, used, remaining);
    }
}
