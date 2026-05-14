package com.pfe.pfe.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "stripe_webhook_event_log")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StripeWebhookEventLog {

    @Id
    @Column(length = 128)
    private String eventId;

    @Column(nullable = false, length = 128)
    private String eventType;

    @Column(nullable = false)
    private LocalDateTime receivedAt = LocalDateTime.now();
}
