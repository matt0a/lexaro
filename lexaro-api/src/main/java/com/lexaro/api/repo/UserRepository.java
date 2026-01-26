package com.lexaro.api.repo;

import com.lexaro.api.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByVerificationToken(String verificationToken);
    Optional<User> findByEmailIgnoreCase(String email);
    Optional<User> findByStripeCustomerId(String stripeCustomerId);
    Optional<User> findByStripeSubscriptionId(String stripeSubscriptionId);
}
