package com.pfe.pfe.security.controller;

import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pfe.pfe.service.ForgotPasswordService;
import com.pfe.pfe.service.TunisieSmsService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Contrôleur pour la réinitialisation de mot de passe
 * Endpoints:
 * - POST /auth/forgot-password/send-code — Envoyer un code (SMS ou e-mail)
 * - POST /auth/forgot-password/verify-code — Vérifier le code
 * - POST /auth/forgot-password/reset — Réinitialiser le mot de passe
 */
@RestController
@RequestMapping("/auth/forgot-password")
@RequiredArgsConstructor
@Slf4j
public class ForgotPasswordController {

    private static final Pattern EMAIL_SYNTAX = Pattern.compile(
            "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    private final ForgotPasswordService forgotPasswordService;
    private final TunisieSmsService tunisieSmsService;

    /**
     * Étape 1: envoyer un code de vérification par SMS ou par e-mail.
     * Body: { "telephone": "21612345678" } OU { "email": "user@example.com" }
     */
    @PostMapping("/send-code")
    public ResponseEntity<Map<String, Object>> sendVerificationCode(@RequestBody Map<String, String> request) {
        try {
            String telephone = request.get("telephone");
            String email = request.get("email");

            boolean hasPhone = telephone != null && !telephone.trim().isEmpty();
            boolean hasEmail = email != null && !email.trim().isEmpty();

            if (hasPhone == hasEmail) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Indiquez soit le numéro de téléphone, soit l'adresse e-mail (pas les deux)."));
            }

            if (hasPhone) {
                telephone = tunisieSmsService.normalizeInternationalTunisia(telephone);
                Map<String, Object> result = forgotPasswordService.sendVerificationCode(telephone);
                return booleanResult(result);
            }

            email = email.trim();
            if (!EMAIL_SYNTAX.matcher(email).matches()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Format d'adresse e-mail invalide"));
            }

            Map<String, Object> result = forgotPasswordService.sendVerificationCodeByEmail(email);
            return booleanResult(result);

        } catch (Exception e) {
            log.error("Erreur lors de l'envoi du code de vérification", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Erreur lors de l'envoi du code: " + e.getMessage()));
        }
    }

    /**
     * Étape 2: vérifier le code.
     * Body: { "telephone", "code" } OU { "email", "code" }
     */
    @PostMapping("/verify-code")
    public ResponseEntity<Map<String, Object>> verifyCode(@RequestBody Map<String, String> request) {
        try {
            String telephone = request.get("telephone");
            String email = request.get("email");
            String code = request.get("code");

            boolean hasPhone = telephone != null && !telephone.trim().isEmpty();
            boolean hasEmail = email != null && !email.trim().isEmpty();

            if (hasPhone == hasEmail) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Indiquez soit le téléphone, soit l'e-mail utilisé à l'étape précédente."));
            }

            if (code == null || code.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Le code de vérification est requis"));
            }

            Map<String, Object> result;
            if (hasPhone) {
                telephone = tunisieSmsService.normalizeInternationalTunisia(telephone);
                result = forgotPasswordService.verifyCode(telephone, code.trim());
            } else {
                email = email.trim().toLowerCase(Locale.ROOT);
                result = forgotPasswordService.verifyCodeByEmail(email, code.trim());
            }

            return booleanResult(result);

        } catch (Exception e) {
            log.error("Erreur lors de la vérification du code", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Erreur lors de la vérification: " + e.getMessage()));
        }
    }

    /**
     * Étape 3: réinitialiser le mot de passe.
     * Body: { "telephone", "newPassword", "resetToken" } OU { "email", "newPassword", "resetToken" }
     */
    @PostMapping("/reset")
    public ResponseEntity<Map<String, Object>> resetPassword(@RequestBody Map<String, String> request) {
        try {
            String telephone = request.get("telephone");
            String email = request.get("email");
            String newPassword = request.get("newPassword");
            String resetToken = request.get("resetToken");

            boolean hasPhone = telephone != null && !telephone.trim().isEmpty();
            boolean hasEmail = email != null && !email.trim().isEmpty();

            if (hasPhone == hasEmail) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Indiquez soit le téléphone, soit l'e-mail utilisé pour la vérification."));
            }

            if (newPassword == null || newPassword.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Le nouveau mot de passe est requis"));
            }

            if (newPassword.length() < 8) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Le mot de passe doit contenir au moins 8 caractères"));
            }

            if (!newPassword.matches(".*[A-Z].*")) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Le mot de passe doit contenir au moins une majuscule"));
            }

            if (!newPassword.matches(".*[a-z].*")) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Le mot de passe doit contenir au moins une minuscule"));
            }

            if (!newPassword.matches(".*[0-9].*")) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Le mot de passe doit contenir au moins un chiffre"));
            }

            if (hasPhone) {
                telephone = tunisieSmsService.normalizeInternationalTunisia(telephone);
            } else {
                email = email.trim().toLowerCase(Locale.ROOT);
            }

            Map<String, Object> result = forgotPasswordService.resetPassword(
                    hasPhone ? telephone : null,
                    hasEmail ? email : null,
                    newPassword,
                    resetToken);

            return booleanResult(result);

        } catch (Exception e) {
            log.error("Erreur lors de la réinitialisation du mot de passe", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Erreur lors de la réinitialisation: " + e.getMessage()));
        }
    }

    private ResponseEntity<Map<String, Object>> booleanResult(Map<String, Object> result) {
        if (Boolean.TRUE.equals(result.get("success"))) {
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.badRequest().body(result);
    }
}
