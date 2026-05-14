package com.pfe.pfe.billing;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.pfe.pfe.billing.crypto.FieldCipher;
import com.pfe.pfe.model.PlatformStripeConfig;
import com.pfe.pfe.repository.PlatformStripeConfigRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class StripeCredentialsService {

    private final PlatformStripeConfigRepository configRepository;
    private final FieldCipher fieldCipher;

    private static boolean looksEncrypted(String value) {
        return value != null && value.contains(".") && value.length() > 32;
    }

    @Value("${STRIPE_PUBLISHABLE_KEY:}")
    private String envPublishableKey;

    @Value("${STRIPE_SECRET_KEY:}")
    private String envSecretKey;

    @Value("${STRIPE_WEBHOOK_SECRET:}")
    private String envWebhookSecret;

    public Optional<PlatformStripeConfig> getConfigRow() {
        return configRepository.findById(BillingConstants.CONFIG_SINGLETON_ID);
    }

    /** Clé publique pour le front (Stripe.js) ou affichage super admin masquée. */
    public String resolvePublishableKey() {
        if (StringUtils.hasText(envPublishableKey)) {
            return envPublishableKey.trim();
        }
        return getConfigRow().map(PlatformStripeConfig::getPublishableKey).filter(StringUtils::hasText).orElse("");
    }

    public String resolveSecretKey() {
        if (StringUtils.hasText(envSecretKey)) {
            return envSecretKey.trim();
        }
        return getConfigRow()
                .map(PlatformStripeConfig::getSecretKeyEnc)
                .filter(StringUtils::hasText)
                .map(encoded -> resolveSecretFromStored(encoded))
                .filter(StringUtils::hasText)
                .orElseThrow(() -> new IllegalStateException(
                        "Aucune clé secrète Stripe : définissez STRIPE_SECRET_KEY ou enregistrez une clé chiffrée "
                                + "(super admin) avec stripe.field-encryption-secret. "
                                + "En local : copiez stripe-local.properties.example vers src/main/resources/stripe-local.properties "
                                + "et renseignez STRIPE_SECRET_KEY=sk_test_… (voir https://dashboard.stripe.com/test/apikeys), "
                                + "ou passez STRIPE_SECRET_KEY dans les variables d'environnement du Run."));
    }

    private String resolveSecretFromStored(String encoded) {
        if (!fieldCipher.isEnabled()) {
            if (looksEncrypted(encoded)) {
                throw new IllegalStateException(
                        "Clé Stripe chiffrée en base mais stripe.field-encryption-secret est vide ou désactivé. "
                                + "Retirez STRIPE_FIELD_ENCRYPTION_SECRET vide de l'environnement, ou définissez "
                                + "STRIPE_SECRET_KEY=sk_test_… pour court-circuiter la base.");
            }
            return encoded.trim();
        }
        try {
            return fieldCipher.decrypt(encoded);
        } catch (RuntimeException e) {
            throw new IllegalStateException(
                    "Impossible de déchiffrer la clé Stripe en base (phrase stripe.field-encryption-secret différente "
                            + "de celle utilisée à l'enregistrement ?). Utilisez STRIPE_SECRET_KEY en variable "
                            + "d'environnement ou ré-enregistrez la clé via super admin.", e);
        }
    }

    public String resolveWebhookSecret() {
        if (StringUtils.hasText(envWebhookSecret)) {
            return envWebhookSecret.trim();
        }
        return getConfigRow()
                .map(PlatformStripeConfig::getWebhookSecretEnc)
                .filter(StringUtils::hasText)
                .map(encoded -> {
                    if (!fieldCipher.isEnabled()) {
                        if (looksEncrypted(encoded)) {
                            return "";
                        }
                        return encoded;
                    }
                    try {
                        return fieldCipher.decrypt(encoded);
                    } catch (Exception e) {
                        return "";
                    }
                })
                .orElse("");
    }

    public boolean hasSecretKey() {
        try {
            return StringUtils.hasText(resolveSecretKey());
        } catch (Exception e) {
            return false;
        }
    }
}
