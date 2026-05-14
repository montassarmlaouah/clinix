package com.pfe.pfe.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Point de contrôle sans authentification (test navigateur / réseau).
 */
@RestController
@RequestMapping("/api")
public class HealthController {

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "Clinux backend",
                "hint",
                "Connexion : POST /auth/login (JSON). En SPA sur le même port 8080, la page /auth/login est servie en GET par l’interface."));
    }
}
