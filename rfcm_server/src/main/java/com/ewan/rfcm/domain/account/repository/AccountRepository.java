package com.ewan.rfcm.domain.account.repository;

import com.ewan.rfcm.domain.account.model.domain.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {
    Optional<Account> findByUserId(String userId);
}
