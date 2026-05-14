package com.pfe.pfe.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.pfe.pfe.security.services.CustomUserDetails;
import com.pfe.pfe.service.InfirmierWorkspaceService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/infirmiers/{infirmierId}/workspace")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class InfirmierWorkspaceController {

    private final InfirmierWorkspaceService infirmierWorkspaceService;

    @PostMapping("/rapport-fin-journee")
    public ResponseEntity<Map<String, String>> rapportFinJournee(
            @PathVariable String infirmierId,
            @RequestBody Map<String, String> body) {
        String connecte = infirmierConnecteId();
        if (connecte == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Session infirmier invalide.");
        }
        String message = body != null ? body.get("message") : null;
        infirmierWorkspaceService.envoyerRapportFinJournee(infirmierId, message, connecte);
        return ResponseEntity.ok(Map.of("status", "OK"));
    }

    @PostMapping("/signalement-medecin")
    public ResponseEntity<Map<String, String>> signalementMedecin(
            @PathVariable String infirmierId,
            @RequestBody Map<String, String> body) {
        String connecte = infirmierConnecteId();
        if (connecte == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Session infirmier invalide.");
        }
        String medecinId = body != null ? body.get("medecinId") : null;
        String patientId = body != null ? body.get("patientId") : null;
        String message = body != null ? body.get("message") : null;
        infirmierWorkspaceService.signalerAnomalieAuMedecin(infirmierId, medecinId, patientId, message, connecte);
        return ResponseEntity.ok(Map.of("status", "OK"));
    }

    private static String infirmierConnecteId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof CustomUserDetails cud) || cud.getId() == null) {
            return null;
        }
        return cud.getId();
    }
}
