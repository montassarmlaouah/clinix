package com.pfe.pfe.controller;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pfe.pfe.dto.OtpIssueResult;
import com.pfe.pfe.model.HistoriqueSms;
import com.pfe.pfe.security.services.CustomUserDetails;
import com.pfe.pfe.service.AuthService;
import com.pfe.pfe.service.OtpSmsService;
import com.pfe.pfe.service.TunisieSmsService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Contrôleur pour la gestion des SMS
 * Endpoints:
 * - POST /api/sms/send - Envoyer un SMS
 * - POST /api/sms/send-otp - Envoyer un code OTP
 * - POST /api/sms/verify-otp - Vérifier un code OTP
 * - GET /api/sms/historique - Obtenir l'historique
 * - GET /api/sms/couts - Obtenir les coûts
 */
@RestController
@RequestMapping("/api/sms")
@RequiredArgsConstructor
@Slf4j
public class SmsController {
    
    private final OtpSmsService otpSmsService;
    private final AuthService authService;
    private final TunisieSmsService tunisieSmsService;

    /**
     * Test d’envoi (JWT) — même logique que la DLL : API_KEY, SENDER, MESSAGES (voir logs pour status / message_id).
     */
    @PostMapping("/test-send")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN_CLINIQUE')")
    public ResponseEntity<Map<String, String>> testSendTunisie(
            @RequestBody Map<String, String> body,
            Authentication auth) {
        String telephone = body.get("telephone");
        String message = body.get("message");
        if (!StringUtils.hasText(telephone) || !StringUtils.hasText(message)) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", "false",
                    "message", "telephone et message sont obligatoires"));
        }
        if (!(auth.getPrincipal() instanceof CustomUserDetails ud)) {
            return ResponseEntity.status(403).body(Map.of(
                    "success", "false",
                    "message", "Utilisateur non reconnu"));
        }
        String tel = tunisieSmsService.normalizeInternationalTunisia(telephone.trim());
        String cliniqueId = "SUPER_ADMIN".equals(ud.getRole()) ? null : ud.getCliniqueId();
        if (!"SUPER_ADMIN".equals(ud.getRole()) && !StringUtils.hasText(cliniqueId)) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", "false",
                    "message", "Clinique inconnue pour cet administrateur"));
        }
        var outcome = tunisieSmsService.sendSmsForCliniqueWithOutcome(cliniqueId, tel, message);
        Map<String, String> out = new HashMap<>();
        out.put("success", outcome.envoye() ? "true" : "false");
        out.put("message", outcome.detail());
        out.put("telephoneNormalise", tel);
        return ResponseEntity.ok(out);
    }

    /**
     * Accusés de réception (DLR) — utilise la clé globale {@code tunisiesms.api.key} (doc POST /api/dlr).
     */
    @PostMapping("/dlr")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN_CLINIQUE')")
    public ResponseEntity<Map<String, Object>> queryDlr(@RequestBody Map<String, Object> body) {
        Object raw = body.get("messageIds");
        if (!(raw instanceof List<?> list)) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", "false");
            err.put("message", "messageIds (tableau) requis");
            return ResponseEntity.badRequest().body(err);
        }
        List<String> ids = new ArrayList<>();
        for (Object o : list) {
            if (o != null) {
                ids.add(String.valueOf(o).trim());
            }
        }
        if (ids.isEmpty()) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", "false");
            err.put("message", "Au moins un messageId");
            return ResponseEntity.badRequest().body(err);
        }
        List<Map<String, Object>> data = tunisieSmsService.queryDlrWithGlobalKey(ids);
        Map<String, Object> response = new HashMap<>();
        response.put("success", "true");
        response.put("data", data);
        return ResponseEntity.ok(response);
    }

    /**
     * Envoyer un SMS
     * POST /api/sms/send
     * Body: {
     *   "telephone": "21612345678",
     *   "message": "Votre message",
     *   "type": "NOTIFICATION|RAPPEL|ALERTE"
     * }
     */
    @PostMapping("/send")
    public ResponseEntity<Map<String, String>> envoyerSms(
            @RequestBody Map<String, String> request) {
        try {
            String telephone = request.get("telephone");
            String message = request.get("message");
            String type = request.getOrDefault("type", "SMS");

            otpSmsService.envoyerSms(telephone, message, type, null);

            return ResponseEntity.ok(Map.of(
                "success", "true",
                "message", "SMS envoyé avec succès"
            ));
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi du SMS: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "success", "false",
                "message", "Erreur: " + e.getMessage()
            ));
        }
    }

    /**
     * Envoyer un code OTP
     * POST /api/sms/send-otp
     * Body: { "telephone": "21612345678" }
     */
    @PostMapping("/send-otp")
    public ResponseEntity<Map<String, String>> envoyerCodeOtp(
            @RequestBody Map<String, String> request) {
        try {
            String telephone = request.get("telephone");
            if (telephone == null || telephone.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", "false",
                    "message", "Le téléphone est obligatoire"
                ));
            }

            telephone = tunisieSmsService.normalizeInternationalTunisia(telephone.trim());
            boolean existe = authService.telephoneExiste(telephone);
            boolean compteEnAttente = authService.compteEnAttente(telephone);
            if (existe && !compteEnAttente) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", "false",
                    "message", "Ce numéro de téléphone est déjà utilisé. Veuillez vous connecter."
                ));
            }

            OtpIssueResult otpResult = otpSmsService.envoyerCodeOtp(telephone);

            Map<String, String> response = new java.util.HashMap<>();
            response.put("success", "true");
            response.put("message", "Code OTP envoyé avec succès");
            // Ne pas renvoyer le code en clair si l'API TunisieSMS a accepté l'envoi (status 200 dans le JSON).
            if (!otpResult.smsEnvoyeParApi()) {
                response.put("code", otpResult.code());
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi du code OTP: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "success", "false",
                "message", "Erreur: " + e.getMessage()
            ));
        }
    }

    /**
     * Vérifier un code OTP
     * POST /api/sms/verify-otp
     * Body: {
     *   "telephone": "21612345678",
     *   "code": "123456"
     * }
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, String>> verifierCodeOtp(
            @RequestBody Map<String, String> request) {
        try {
            String telephone = request.get("telephone");
            String code = request.get("code");
            if (telephone == null || telephone.trim().isEmpty() || code == null || code.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", "false",
                    "message", "Téléphone et code sont obligatoires"
                ));
            }

            telephone = tunisieSmsService.normalizeInternationalTunisia(telephone.trim());
            boolean isValid = otpSmsService.verifierCodeOtp(telephone, code);

            if (isValid) {
                return ResponseEntity.ok(Map.of(
                    "success", "true",
                    "message", "Code OTP valide"
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", "false",
                    "message", "Code OTP invalide ou expiré"
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", "false",
                "message", "Erreur: " + e.getMessage()
            ));
        }
    }

    /**
     * Obtenir l'historique des SMS
     * GET /api/sms/historique?telephone=21612345678
     */
    @GetMapping("/historique")
    public ResponseEntity<List<HistoriqueSms>> obtenirHistorique(
            @RequestParam String telephone) {
        try {
            List<HistoriqueSms> historique = otpSmsService.obtenirHistoriqueSms(telephone);
            return ResponseEntity.ok(historique);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération de l'historique: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Obtenir le coût total des SMS
     * GET /api/sms/couts?debut=2024-01-01&fin=2024-12-31
     */
    @GetMapping("/couts")
    public ResponseEntity<Map<String, Object>> obtenirCouts(
            @RequestParam String debut,
            @RequestParam String fin) {
        try {
            LocalDateTime dateDebut = LocalDateTime.parse(debut);
            LocalDateTime dateFin = LocalDateTime.parse(fin);
            
            Double coutTotal = otpSmsService.obtenirCoutTotal(dateDebut, dateFin);

            return ResponseEntity.ok(Map.of(
                "success", "true",
                "coutTotal", coutTotal,
                "devise", "USD"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", "false",
                "message", "Erreur: " + e.getMessage()
            ));
        }
    }
}
