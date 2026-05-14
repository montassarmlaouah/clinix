package com.pfe.pfe.billing.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Data;

@Data
@Component
@ConfigurationProperties(prefix = "app.billing")
public class BillingAppProperties {

    /**
     * Code devise Stripe (ex. usd en test, tnd si activé sur le compte Stripe).
     */
    private String stripeCurrency = "usd";

    private String successUrl = "http://localhost:4200/mon-abonnement?checkout=success";

    private String cancelUrl = "http://localhost:4200/mon-abonnement?checkout=cancel";
}
