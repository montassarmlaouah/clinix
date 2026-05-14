package com.pfe.pfe.security.controller;

import java.util.Map;

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
 * - POST /auth/forgot-password/send-code - Envoyer un code de vérification
 * - POST /auth/forgot-password/verify-code - Vérifier le code
 * - POST /auth/forgot-password/reset - Réinitialiser le mot de passe
 */
@RestController
@RequestMapping("/auth/forgot-password")
@RequiredArgsConstructor
@Slf4j
public class ForgotPasswordController {

    private final ForgotPasswordService forgotPasswordService;
    private final TunisieSmsService tunisieSmsService;

    /**
     * Étape 1: Envoyer un code de vérification par SMS
     * POST /auth/forgot-password/send-code
     * Body: { "telephone": "21612345678" }
     */
    @PostMapping("/send-code")
    public ResponseEntity<Map<String, Object>> sendVerificationCode(@RequestBody Map<String, String> request) {
        try {
            String telephone = request.get("telephone");
            
            if (telephone == null || telephone.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Le numéro de téléphone est requis"
                ));
            }

            telephone = tunisieSmsService.normalizeInternationalTunisia(telephone);

            Map<String, Object> result = forgotPasswordService.sendVerificationCode(telephone);
            
            if ((boolean) result.get("success")) {
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.badRequest().body(result);
            }
            
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi du code de vérification", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Erreur lors de l'envoi du code: " + e.getMessage()
            ));
        }
    }

    /**
     * Étape 2: Vérifier le code de vérification
     * POST /auth/forgot-password/verify-code
     * Body: { "telephone": "21612345678", "code": "123456" }
     */
    @PostMapping("/verify-code")
    public ResponseEntity<Map<String, Object>> verifyCode(@RequestBody Map<String, String> request) {
        try {
            String telephone = request.get("telephone");
            String code = request.get("code");

            if (telephone == null || telephone.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Le numéro de téléphone est requis"
                ));
            }

            if (code == null || code.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Le code de vérification est requis"
                ));
            }

            telephone = tunisieSmsService.normalizeInternationalTunisia(telephone);

            Map<String, Object> result = forgotPasswordService.verifyCode(telephone, code.trim());
            
            if ((boolean) result.get("success")) {
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.badRequest().body(result);
            }

        } catch (Exception e) {
            log.error("Erreur lors de la vérification du code", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Erreur lors de la vérification: " + e.getMessage()
            ));
        }
    }

    /**
     * Étape 3: Réinitialiser le mot de passe
     * POST /auth/forgot-password/reset
     * Body: { "telephone": "21612345678", "newPassword": "NewPassword123!", "resetToken": "..." }
     */
    @PostMapping("/reset")
    public ResponseEntity<Map<String, Object>> resetPassword(@RequestBody Map<String, String> request) {
        try {
            String telephone = request.get("telephone");
            String newPassword = request.get("newPassword");
            String resetToken = request.get("resetToken");

            if (telephone == null || telephone.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Le numéro de téléphone est requis"
                ));
            }

            if (newPassword == null || newPassword.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Le nouveau mot de passe est requis"
                ));
            }

            // Validation du mot de passe
            if (newPassword.length() < 8) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Le mot de passe doit contenir au moins 8 caractères"
                ));
            }

            if (!newPassword.matches(".*[A-Z].*")) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Le mot de passe doit contenir au moins une majuscule"
                ));
            }

            if (!newPassword.matches(".*[a-z].*")) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Le mot de passe doit contenir au moins une minuscule"
                ));
            }

            if (!newPassword.matches(".*[0-9].*")) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Le mot de passe doit contenir au moins un chiffre"
                ));
            }

            telephone = tunisieSmsService.normalizeInternationalTunisia(telephone);

            Map<String, Object> result = forgotPasswordService.resetPassword(telephone, newPassword, resetToken);
            
            if ((boolean) result.get("success")) {
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.badRequest().body(result);
            }

        } catch (Exception e) {
            log.error("Erreur lors de la réinitialisation du mot de passe", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Erreur lors de la réinitialisation: " + e.getMessage()
            ));
        }
    }
}
