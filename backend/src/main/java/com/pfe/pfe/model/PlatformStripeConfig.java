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
@Table(name = "platform_stripe_config")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlatformStripeConfig {

    @Id
    private String id;

    /** TEST ou LIVE */
    @Column(name = "mode_facturation", nullable = false, length = 8)
    private String modeFacturation = "TEST";

    @Column(name = "publishable_key", columnDefinition = "TEXT")
    private String publishableKey;

    @Column(name = "secret_key_enc", columnDefinition = "TEXT")
    private String secretKeyEnc;

    @Column(name = "webhook_secret_enc", columnDefinition = "TEXT")
    private String webhookSecretEnc;

    @Column(name = "mise_a_jour", nullable = false)
    private LocalDateTime miseAJour = LocalDateTime.now();
}
