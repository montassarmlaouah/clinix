package com.pfe.pfe.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Contrôleur des alertes applicatives.
 */
@RestController
@RequestMapping("/api/alertes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class AlerteController {

    /**
     * POST /api/alertes/urgence
     * Déclare une urgence patient afin d'alerter rapidement les médecins.
     */
    @PostMapping("/urgence")
    public ResponseEntity<Map<String, String>> signalerUrgence(@RequestBody Map<String, String> payload) {
        String patientId = payload.getOrDefault("patientId", "inconnu");
        String message = payload.getOrDefault("message", "Urgence signalée par un infirmier");
        String localisation = payload.getOrDefault("localisation", "non précisée");

        log.warn("[URGENCE] patientId={}, localisation={}, message={}", patientId, localisation, message);
        return ResponseEntity.ok(Map.of(
                "message", "Urgence transmise aux responsables médicaux",
                "patientId", patientId
        ));
    }

    /**
     * POST /api/alertes/manque-materiel
     * Déclare un manque de matériel pour traitement par la logistique.
     */
    @PostMapping("/manque-materiel")
    public ResponseEntity<Map<String, String>> signalerManqueMateriel(@RequestBody Map<String, String> payload) {
        String equipementNom = payload.getOrDefault("equipementNom", "Matériel non précisé");
        String quantite = payload.getOrDefault("quantite", "N/A");
        String message = payload.getOrDefault("message", "Manque de matériel signalé");

        log.warn("[MANQUE_MATERIEL] equipement={}, quantite={}, message={}", equipementNom, quantite, message);
        return ResponseEntity.ok(Map.of("message", "Signalement de manque de matériel enregistré"));
    }
}
