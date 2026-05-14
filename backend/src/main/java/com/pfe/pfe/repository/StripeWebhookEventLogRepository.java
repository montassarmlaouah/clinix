package com.pfe.pfe.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pfe.pfe.model.StripeWebhookEventLog;

public interface StripeWebhookEventLogRepository extends JpaRepository<StripeWebhookEventLog, String> {
}
