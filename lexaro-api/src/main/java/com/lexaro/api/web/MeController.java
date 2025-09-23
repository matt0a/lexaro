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

    public record UsageDto(
            String plan,
            boolean unlimited,
            boolean verified,
            long monthlyCap, long monthlyUsed, long monthlyRemaining,
            long dailyCap,   long dailyUsed,   long dailyRemaining
    ) {}

    @GetMapping("/usage")
    public UsageDto usage() {
        var u = users.findById(userId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        var plan = plans.effectivePlan(u);
        boolean unlimited = plans.isUnlimited(u);
        boolean verified  = u.isVerified();

        long mCap  = unlimited ? Long.MAX_VALUE : plans.monthlyCapForPlan(plan);
        long mUsed = unlimited ? 0L : quota.currentMonthly(u.getId());
        long mRem  = unlimited ? Long.MAX_VALUE : Math.max(0, mCap - mUsed);

        long dCap  = unlimited ? Long.MAX_VALUE : plans.dailyCapForPlan(plan);
        long dUsed = unlimited ? 0L : quota.currentDaily(u.getId());
        long dRem  = unlimited ? Long.MAX_VALUE : Math.max(0, dCap - dUsed);

        return new UsageDto(plan.name(), unlimited, verified, mCap, mUsed, mRem, dCap, dUsed, dRem);
    }
}
