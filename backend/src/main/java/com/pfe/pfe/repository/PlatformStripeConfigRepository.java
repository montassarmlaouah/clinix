package com.pfe.pfe.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pfe.pfe.model.PlatformStripeConfig;

public interface PlatformStripeConfigRepository extends JpaRepository<PlatformStripeConfig, String> {
}
