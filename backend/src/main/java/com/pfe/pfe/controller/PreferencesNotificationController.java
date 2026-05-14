package com.pfe.pfe.controller;

import com.pfe.pfe.model.ConfigurationNotification;
import com.pfe.pfe.service.ConfigurationNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

/**
 * Contrôleur pour les préférences de notifications
 * Endpoints:
 * - GET /api/preferences-notifications/{userId} - Récupérer les préférences
 * - PUT /api/preferences-notifications/{userId} - Mettre à jour
 * - POST /api/preferences-notifications/{userId}/activer-tous - Activer tous
 * - POST /api/preferences-notifications/{userId}/desactiver-tous - Désactiver tous
 */
@RestController
@RequestMapping("/api/preferences-notifications")
@RequiredArgsConstructor
@Slf4j
public class PreferencesNotificationController {
    
    private final ConfigurationNotificationService configService;


    @GetMapping("/{userId}")
    public ResponseEntity<ConfigurationNotification> obtenirPreferences(
            @PathVariable String userId) {
        ConfigurationNotification config = configService.obtenirConfiguration(userId);
        return ResponseEntity.ok(config);
    }


    @PutMapping("/{userId}")
    public ResponseEntity<ConfigurationNotification> mettreAJourPreferences(
            @PathVariable String userId,
            @RequestBody ConfigurationNotification config) {
        try {
            ConfigurationNotification updated = configService.mettreAJourConfiguration(userId, config);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("Erreur lors de la mise à jour: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Activer tous les types de notifications
     * POST /api/preferences-notifications/{userId}/activer-tous
     */
    @PostMapping("/{userId}/activer-tous")
    public ResponseEntity<Map<String, String>> activerTous(
            @PathVariable String userId) {
        try {
            configService.activerToutesNotifications(userId);
            return ResponseEntity.ok(Map.of(
                "success", "true",
                "message", "Toutes les notifications sont activées"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", "false",
                "message", "Erreur: " + e.getMessage()
            ));
        }
    }

    /**
     * Désactiver tous les types de notifications
     * POST /api/preferences-notifications/{userId}/desactiver-tous
     */
    @PostMapping("/{userId}/desactiver-tous")
    public ResponseEntity<Map<String, String>> desactiverTous(
            @PathVariable String userId) {
        try {
            configService.desactiverToutesNotifications(userId);
            return ResponseEntity.ok(Map.of(
                "success", "true",
                "message", "Toutes les notifications sont désactivées"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", "false",
                "message", "Erreur: " + e.getMessage()
            ));
        }
    }
}
