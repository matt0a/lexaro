package com.lexaro.api.web;

import com.lexaro.api.domain.Plan;
import com.lexaro.api.domain.User;
import com.lexaro.api.repo.UserRepository;
import com.lexaro.api.service.PlanService;
import com.lexaro.api.service.TtsQuotaService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
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

    @Data
    public static class UsageDto {
        private final String  plan;
        private final boolean unlimited;
        private final boolean verified;

        private final long monthlyCap;        // base cap from plan (no top-ups)
        private final long monthlyUsed;
        private final long monthlyRemaining;  // base + top-ups - used

        private final long dailyCap;
        private final long dailyUsed;
        private final long dailyRemaining;
    }

    @GetMapping("/usage")
    public UsageDto usage() {
        var u = users.findById(userId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        var plan = plans.effectivePlan(u);
        boolean unlimited = plans.isUnlimited(u);
        boolean verified  = u.isVerified();

        long mCap  = unlimited ? Long.MAX_VALUE : plans.monthlyCapForPlan(plan);
        long mUsed = unlimited ? 0L : quota.currentMonthly(u.getId());
        long mRem  = unlimited ? Long.MAX_VALUE : quota.monthlyRemaining(u.getId(), plan, mUsed);

        long dCap  = unlimited ? Long.MAX_VALUE : plans.dailyCapForPlan(plan);
        long dUsed = unlimited ? 0L : quota.currentDaily(u.getId());
        long dRem  = unlimited ? Long.MAX_VALUE : Math.max(0, dCap - dUsed);

        return new UsageDto(plan.name(), unlimited, verified, mCap, mUsed, mRem, dCap, dUsed, dRem);
    }

    @Data
    public static class SetPlanReq { public String plan; }

    /** Dev/admin only: set plan and implied retention days */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/plan")
    @Transactional
    public void setPlan(@RequestBody SetPlanReq req) {
        var u = users.findById(userId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        final Plan newPlan;
        try {
            newPlan = Plan.valueOf(req.plan.trim().toUpperCase());
        } catch (Exception e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Unknown plan. Use one of: FREE, PREMIUM, BUSINESS, BUSINESS_PLUS"
            );
        }

        u.setPlan(newPlan);

        // Derive retention via existing API that expects a User
        var tmp = User.builder().plan(newPlan).build();
        u.setRetentionDays(plans.retentionDaysFor(tmp));

        users.save(u);
    }
}
