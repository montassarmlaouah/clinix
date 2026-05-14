package com.pfe.pfe.billing.crypto;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Chiffrement AES-GCM pour clés Stripe stockées en base (nécessite
 * {@code stripe.field-encryption-secret} — phrase interne dérivée en clé AES-256).
 */
@Component
public class FieldCipher {

    private static final int GCM_TAG_BITS = 128;
    private static final int IV_LEN = 12;

    private final SecretKey aesKey;

    public FieldCipher(@Value("${stripe.field-encryption-secret:}") String derivationSecret) {
        if (!StringUtils.hasText(derivationSecret)) {
            this.aesKey = null;
        } else {
            try {
                byte[] digest = MessageDigest.getInstance("SHA-256")
                        .digest(derivationSecret.getBytes(StandardCharsets.UTF_8));
                this.aesKey = new SecretKeySpec(digest, "AES");
            } catch (Exception e) {
                throw new IllegalStateException("Impossible d'initialiser le chiffrement des secrets", e);
            }
        }
    }

    public boolean isEnabled() {
        return aesKey != null;
    }

    public String encrypt(String plaintext) {
        requireEnabled();
        try {
            byte[] iv = new byte[IV_LEN];
            SecureRandom.getInstanceStrong().nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, aesKey, new GCMParameterSpec(GCM_TAG_BITS, iv));
            byte[] enc = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(iv) + "." + Base64.getEncoder().encodeToString(enc);
        } catch (Exception e) {
            throw new IllegalStateException("Chiffrement impossible", e);
        }
    }

    public String decrypt(String stored) {
        requireEnabled();
        if (stored == null || stored.isBlank()) {
            return null;
        }
        try {
            int dot = stored.indexOf('.');
            if (dot < 0) {
                return null;
            }
            byte[] iv = Base64.getDecoder().decode(stored.substring(0, dot));
            byte[] enc = Base64.getDecoder().decode(stored.substring(dot + 1));
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, aesKey, new GCMParameterSpec(GCM_TAG_BITS, iv));
            byte[] plain = cipher.doFinal(enc);
            return new String(plain, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Déchiffrement impossible", e);
        }
    }

    private void requireEnabled() {
        if (!isEnabled()) {
            throw new IllegalStateException(
                    "Configurez stripe.field-encryption-secret (phrase longue) pour stocker des clés Stripe chiffrées en base.");
        }
    }
}
